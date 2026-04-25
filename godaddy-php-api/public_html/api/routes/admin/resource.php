<?php

function api_admin_resource_route(PDO $pdo, string $resource, array $segments = []): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $id = isset($segments[0]) && ctype_digit((string) $segments[0]) ? (int) $segments[0] : null;

    if ($resource === 'inventory' && ($segments[1] ?? '') === 'approve') {
        api_json([
            'resource' => 'inventory',
            'action' => 'approve',
            'id' => $id,
            'message' => 'Replace this stub with product approval logic.',
        ]);
    }

    if (!api_current_admin($pdo)) {
        api_json(['error' => 'unauthorized'], 401);
    }

    if ($method === 'GET') {
        switch ($resource) {
            case 'dashboard':
                $kpiRows = api_query_all(
                    $pdo,
                    'SELECT
                        (SELECT COUNT(*) FROM products) AS totalProducts,
                        (SELECT COUNT(*) FROM vendors WHERE is_active = 1) AS activeVendors,
                        (SELECT COUNT(*) FROM rfqs WHERE status IN (\'New\', \'Pending\', \'Open\')) AS openRfqs,
                        (SELECT COUNT(*) FROM complaints WHERE status IN (\'New\', \'Pending\')) AS pendingComplaints'
                );
                $kpis = $kpiRows[0] ?? [
                    'totalProducts' => 0,
                    'activeVendors' => 0,
                    'openRfqs' => 0,
                    'pendingComplaints' => 0,
                ];
                api_json([
                    'totalProducts' => (int) ($kpis['totalProducts'] ?? 0),
                    'activeVendors' => (int) ($kpis['activeVendors'] ?? 0),
                    'openRfqs' => (int) ($kpis['openRfqs'] ?? 0),
                    'pendingComplaints' => (int) ($kpis['pendingComplaints'] ?? 0),
                ]);

            case 'analytics':
                $subAction = strtolower((string) ($segments[0] ?? ''));

                if ($subAction === 'revenue-chart') {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT DATE_FORMAT(created_at, "%Y-%m") AS month, COALESCE(SUM(total_amount), 0) AS revenue, COUNT(*) AS orders
                         FROM orders
                         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                         GROUP BY DATE_FORMAT(created_at, "%Y-%m")
                         ORDER BY month ASC'
                    );

                    $byMonth = [];
                    foreach ($rows as $row) {
                        $byMonth[$row['month']] = [
                            'month' => $row['month'],
                            'revenue' => (float) $row['revenue'],
                            'orders' => (int) $row['orders'],
                        ];
                    }

                    $chart = [];
                    for ($offset = 11; $offset >= 0; $offset--) {
                        $key = date('Y-m', strtotime("-{$offset} months"));
                        $chart[] = $byMonth[$key] ?? ['month' => $key, 'revenue' => 0.0, 'orders' => 0];
                    }

                    api_json($chart);
                }

                if ($subAction === 'top-customers') {
                    $limit = max(1, (int) ($_GET['limit'] ?? 5));
                    $rows = api_query_all(
                        $pdo,
                        'SELECT o.user_id AS userId, u.name, u.email, COALESCE(SUM(o.total_amount), 0) AS totalRevenue, COUNT(o.id) AS orderCount
                         FROM orders o
                         LEFT JOIN users u ON u.id = o.user_id
                         GROUP BY o.user_id, u.name, u.email
                         ORDER BY totalRevenue DESC, orderCount DESC
                         LIMIT ' . $limit
                    );

                    foreach ($rows as &$row) {
                        $row['userId'] = (int) $row['userId'];
                        $row['totalRevenue'] = (float) $row['totalRevenue'];
                        $row['orderCount'] = (int) $row['orderCount'];
                    }

                    api_json($rows);
                }

                if ($subAction === 'top-vendors') {
                    $limit = max(1, (int) ($_GET['limit'] ?? 5));
                    $rows = api_query_all(
                        $pdo,
                        'SELECT COALESCE(p.vendor, \'Unknown\') AS vendor, COALESCE(SUM(oi.price * oi.quantity), 0) AS totalRevenue, COUNT(DISTINCT oi.order_id) AS orderCount, COUNT(DISTINCT p.id) AS productCount
                         FROM order_items oi
                         INNER JOIN products p ON p.id = oi.product_id
                         GROUP BY COALESCE(p.vendor, \'Unknown\')
                         ORDER BY totalRevenue DESC, orderCount DESC
                         LIMIT ' . $limit
                    );

                    foreach ($rows as &$row) {
                        $row['totalRevenue'] = (float) $row['totalRevenue'];
                        $row['orderCount'] = (int) $row['orderCount'];
                        $row['productCount'] = (int) $row['productCount'];
                    }

                    api_json($rows);
                }

                if ($subAction === 'revenue-by-category') {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT COALESCE(c.name, p.category, \'Uncategorized\') AS category, COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue, COUNT(DISTINCT oi.order_id) AS orderCount
                         FROM order_items oi
                         INNER JOIN products p ON p.id = oi.product_id
                         LEFT JOIN categories c ON c.id = p.category_id
                         GROUP BY COALESCE(c.name, p.category, \'Uncategorized\')
                         ORDER BY revenue DESC, orderCount DESC'
                    );

                    foreach ($rows as &$row) {
                        $row['revenue'] = (float) $row['revenue'];
                        $row['orderCount'] = (int) $row['orderCount'];
                    }

                    api_json($rows);
                }

                if ($subAction === 'conversion-funnel') {
                    $counts = api_query_all(
                        $pdo,
                        'SELECT
                            (SELECT COUNT(*) FROM users) AS totalUsers,
                            (SELECT COUNT(*) FROM orders) AS totalOrders,
                            (SELECT COUNT(*) FROM orders WHERE status = \'Delivered\') AS completedOrders,
                            (SELECT COUNT(*) FROM rfqs) AS totalRfqs,
                            (SELECT COUNT(*) FROM quotes) AS totalQuotes'
                    );
                    $summary = $counts[0] ?? [
                        'totalUsers' => 0,
                        'totalOrders' => 0,
                        'completedOrders' => 0,
                        'totalRfqs' => 0,
                        'totalQuotes' => 0,
                    ];

                    $totalUsers = (int) ($summary['totalUsers'] ?? 0);
                    $totalOrders = (int) ($summary['totalOrders'] ?? 0);
                    $completedOrders = (int) ($summary['completedOrders'] ?? 0);
                    $totalRfqs = (int) ($summary['totalRfqs'] ?? 0);
                    $totalQuotes = (int) ($summary['totalQuotes'] ?? 0);

                    $funnelStages = [
                        ['stage' => 'Users', 'count' => $totalUsers],
                        ['stage' => 'RFQs', 'count' => $totalRfqs],
                        ['stage' => 'Quotes', 'count' => $totalQuotes],
                        ['stage' => 'Orders', 'count' => $totalOrders],
                        ['stage' => 'Completed', 'count' => $completedOrders],
                    ];

                    $funnel = [];
                    $previous = null;
                    foreach ($funnelStages as $stage) {
                        $count = (int) $stage['count'];
                        $percentage = $totalUsers > 0 ? round(($count / $totalUsers) * 100, 2) : 0;
                        $conversionFromPrevious = $previous !== null && $previous > 0 ? round(($count / $previous) * 100, 2) : 0;
                        $funnel[] = [
                            'stage' => $stage['stage'],
                            'count' => $count,
                            'percentage' => $percentage,
                            'conversionFromPrevious' => $conversionFromPrevious,
                        ];
                        $previous = $count;
                    }

                    api_json([
                        'funnel' => $funnel,
                        'summary' => [
                            'overallConversion' => $totalUsers > 0 ? round(($completedOrders / $totalUsers) * 100, 2) : 0,
                            'totalUsers' => $totalUsers,
                            'totalOrders' => $totalOrders,
                            'completedOrders' => $completedOrders,
                        ],
                    ]);
                }

                $analyticsRows = api_query_all(
                    $pdo,
                    'SELECT
                        (SELECT COUNT(*) FROM orders) AS totalOrders,
                        COALESCE((SELECT SUM(total_amount) FROM orders), 0) AS totalRevenue,
                        COALESCE((SELECT AVG(total_amount) FROM orders), 0) AS avgOrderValue,
                        (SELECT COUNT(*) FROM orders WHERE status IN (\'Pending\', \'Processing\')) AS pendingOrders,
                        (SELECT COUNT(*) FROM orders WHERE status = \'Delivered\') AS deliveredOrders,
                        (SELECT COUNT(*) FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS recentOrders,
                        COALESCE((SELECT SUM(total_amount) FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)), 0) AS recentRevenue,
                        (SELECT COUNT(*) FROM products) AS totalProducts,
                        (SELECT COUNT(*) FROM vendors) AS totalVendors,
                        (SELECT COUNT(*) FROM users) AS totalUsers,
                        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS activeUsers,
                        (SELECT COUNT(*) FROM rfqs) AS totalRfqs,
                        (SELECT COUNT(*) FROM rfqs WHERE status IN (\'New\', \'Pending\', \'Open\')) AS openRfqs,
                        (SELECT COUNT(*) FROM quotes) AS totalQuotes,
                        (SELECT COUNT(*) FROM reviews) AS totalReviews,
                        (SELECT COUNT(*) FROM reviews WHERE status = \'Pending\') AS pendingReviews'
                );
                $analyticsBase = $analyticsRows[0] ?? [];

                $popularProducts = api_query_all(
                    $pdo,
                    'SELECT p.id, p.name, COALESCE(NULLIF(p.category, \'\'), c.name, \'Uncategorized\') AS category, COUNT(DISTINCT oi.order_id) AS orderCount, COALESCE(SUM(oi.quantity), 0) AS totalQuantity
                     FROM order_items oi
                     INNER JOIN products p ON p.id = oi.product_id
                     LEFT JOIN categories c ON c.id = p.category_id
                     GROUP BY p.id, p.name, COALESCE(NULLIF(p.category, \'\'), c.name, \'Uncategorized\')
                     ORDER BY orderCount DESC, totalQuantity DESC
                     LIMIT 10'
                );

                foreach ($popularProducts as &$product) {
                    $product['id'] = (int) $product['id'];
                    $product['orderCount'] = (int) $product['orderCount'];
                    $product['totalQuantity'] = (int) $product['totalQuantity'];
                }

                $vendorTop = api_query_all(
                    $pdo,
                    'SELECT COALESCE(p.vendor, \'Unknown\') AS vendor, COALESCE(SUM(oi.price * oi.quantity), 0) AS totalRevenue, COUNT(DISTINCT oi.order_id) AS orderCount, COUNT(DISTINCT p.id) AS productCount
                     FROM order_items oi
                     INNER JOIN products p ON p.id = oi.product_id
                     GROUP BY COALESCE(p.vendor, \'Unknown\')
                     ORDER BY totalRevenue DESC, orderCount DESC
                     LIMIT 10'
                );

                foreach ($vendorTop as &$vendor) {
                    $vendor['totalRevenue'] = (float) $vendor['totalRevenue'];
                    $vendor['orderCount'] = (int) $vendor['orderCount'];
                    $vendor['productCount'] = (int) $vendor['productCount'];
                }

                $usersByRole = api_query_all(
                    $pdo,
                    'SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC'
                );
                foreach ($usersByRole as &$row) {
                    $row['_count'] = ['role' => (int) $row['count']];
                    unset($row['count']);
                }

                $rfqsByStatus = api_query_all(
                    $pdo,
                    'SELECT status, COUNT(*) AS count FROM rfqs GROUP BY status ORDER BY count DESC'
                );
                foreach ($rfqsByStatus as &$row) {
                    $row['_count'] = ['status' => (int) $row['count']];
                    unset($row['count']);
                }

                $quotesByStatus = api_query_all(
                    $pdo,
                    'SELECT status, COUNT(*) AS count FROM quotes GROUP BY status ORDER BY count DESC'
                );
                $quoteTotal = 0;
                $approvedQuotes = 0;
                foreach ($quotesByStatus as &$row) {
                    $count = (int) $row['count'];
                    $quoteTotal += $count;
                    if (in_array($row['status'], ['Accepted', 'Approved', 'Won'], true)) {
                        $approvedQuotes += $count;
                    }
                    $row['_count'] = ['status' => $count];
                    unset($row['count']);
                }

                $reviewsByStatus = api_query_all(
                    $pdo,
                    'SELECT status, COUNT(*) AS count FROM reviews GROUP BY status ORDER BY count DESC'
                );
                foreach ($reviewsByStatus as &$row) {
                    $row['_count'] = ['status' => (int) $row['count']];
                    unset($row['count']);
                }

                api_json([
                    'sales' => [
                        'totalOrders' => (int) ($analyticsBase['totalOrders'] ?? 0),
                        'totalRevenue' => (float) ($analyticsBase['totalRevenue'] ?? 0),
                        'avgOrderValue' => (float) ($analyticsBase['avgOrderValue'] ?? 0),
                        'pendingOrders' => (int) ($analyticsBase['pendingOrders'] ?? 0),
                        'deliveredOrders' => (int) ($analyticsBase['deliveredOrders'] ?? 0),
                        'recentOrders' => (int) ($analyticsBase['recentOrders'] ?? 0),
                        'recentRevenue' => (float) ($analyticsBase['recentRevenue'] ?? 0),
                    ],
                    'products' => ['popular' => $popularProducts],
                    'vendors' => ['top' => $vendorTop],
                    'users' => [
                        'total' => (int) ($analyticsBase['totalUsers'] ?? 0),
                        'active' => (int) ($analyticsBase['activeUsers'] ?? 0),
                        'byRole' => $usersByRole,
                    ],
                    'rfqs' => [
                        'total' => (int) ($analyticsBase['totalRfqs'] ?? 0),
                        'byStatus' => $rfqsByStatus,
                    ],
                    'quotes' => [
                        'total' => (int) ($analyticsBase['totalQuotes'] ?? 0),
                        'byStatus' => $quotesByStatus,
                        'conversionRate' => $quoteTotal > 0 ? round(($approvedQuotes / $quoteTotal) * 100, 2) : 0,
                    ],
                    'reviews' => [
                        'total' => (int) ($analyticsBase['totalReviews'] ?? 0),
                        'pending' => (int) ($analyticsBase['pendingReviews'] ?? 0),
                        'byStatus' => $reviewsByStatus,
                    ],
                ]);

            case 'inventory':
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT p.id, p.name, p.category, p.category_id AS categoryId, p.image, p.photos, p.description, p.reference_code AS referenceCode, p.vendor, p.price, p.availability, p.warranty, p.warranty_status AS warrantyStatus, p.rating, p.review_count AS reviewCount, p.status, p.warranty_expiry AS warrantyExpiry, p.created_at AS createdAt, p.updated_at AS updatedAt
                         FROM products p
                         WHERE p.id = :id
                         LIMIT 1',
                        ['id' => $id]
                    );

                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }

                    $row['categoryId'] = $row['categoryId'] !== null ? (int) $row['categoryId'] : null;
                    $row['photos'] = api_json_decode_array($row['photos'] ?? null);
                    $row['rating'] = $row['rating'] !== null ? (float) $row['rating'] : null;
                    $row['reviewCount'] = (int) ($row['reviewCount'] ?? 0);
                    api_json($row);
                }

                $items = api_query_all(
                    $pdo,
                    'SELECT p.id, p.name, COALESCE(NULLIF(p.category, \'\'), c.name) AS category, p.category_id AS categoryId, p.image, p.photos, p.description, p.reference_code AS referenceCode, p.vendor, p.price, p.availability, p.warranty, p.warranty_status AS warrantyStatus, p.rating, p.review_count AS reviewCount, p.status, p.warranty_expiry AS warrantyExpiry, p.created_at AS createdAt, p.updated_at AS updatedAt, c.slug AS categorySlug
                     FROM products p
                     LEFT JOIN categories c ON c.id = p.category_id
                     ORDER BY p.updated_at DESC, p.id DESC'
                );

                foreach ($items as &$item) {
                    $item['categoryId'] = $item['categoryId'] !== null ? (int) $item['categoryId'] : null;
                    $item['photos'] = api_json_decode_array($item['photos'] ?? null);
                    $item['rating'] = $item['rating'] !== null ? (float) $item['rating'] : null;
                    $item['reviewCount'] = (int) ($item['reviewCount'] ?? 0);
                }

                api_json($items);

            case 'users':
                $users = api_query_all(
                    $pdo,
                    'SELECT id, name, email, role, is_active AS isActive, last_active_at AS lastActiveAt, vendor_id AS vendorId, created_at AS createdAt, updated_at AS updatedAt
                     FROM users
                     ORDER BY created_at DESC, id DESC'
                );

                foreach ($users as &$user) {
                    $user['isActive'] = (bool) $user['isActive'];
                    $user['vendorId'] = $user['vendorId'] !== null ? (int) $user['vendorId'] : null;
                }

                api_json($users);

            case 'vendors':
                $vendors = api_query_all(
                    $pdo,
                    'SELECT id, name, location, specialty, verification_status AS verificationStatus, is_active AS isActive, rating, image, certifications, created_at AS createdAt, updated_at AS updatedAt
                     FROM vendors
                     ORDER BY created_at DESC, id DESC'
                );

                foreach ($vendors as &$vendor) {
                    $vendor['isActive'] = (bool) $vendor['isActive'];
                    $vendor['rating'] = $vendor['rating'] !== null ? (float) $vendor['rating'] : null;
                    $vendor['certifications'] = api_json_decode_array($vendor['certifications'] ?? null);
                }

                api_json($vendors);

            case 'orders':
                $orders = api_query_all(
                    $pdo,
                    'SELECT id, user_id AS userId, order_number AS orderNumber, total_amount AS totalAmount, currency, status, shipping_address AS shippingAddress, billing_address AS billingAddress, payment_method AS paymentMethod, payment_status AS paymentStatus, tracking_number AS trackingNumber, shipping_carrier AS shippingCarrier, shipped_at AS shippedAt, delivered_at AS deliveredAt, created_at AS createdAt, updated_at AS updatedAt
                     FROM orders
                     ORDER BY created_at DESC, id DESC'
                );

                if ($orders) {
                    $orderIds = array_map(static fn ($order) => (int) $order['id'], $orders);
                    $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
                    $items = api_query_all(
                        $pdo,
                        'SELECT id, order_id AS orderId, product_id AS productId, quantity, price
                         FROM order_items
                         WHERE order_id IN (' . $placeholders . ')
                         ORDER BY id ASC',
                        $orderIds
                    );

                    $itemsByOrder = [];
                    foreach ($items as $item) {
                        $orderId = (int) $item['orderId'];
                        unset($item['orderId']);
                        $item['productId'] = (int) $item['productId'];
                        $item['quantity'] = (int) $item['quantity'];
                        $item['price'] = (float) $item['price'];
                        $itemsByOrder[$orderId][] = $item;
                    }

                    foreach ($orders as &$order) {
                        $order['userId'] = (int) $order['userId'];
                        $order['totalAmount'] = (float) $order['totalAmount'];
                        $order['items'] = $itemsByOrder[(int) $order['id']] ?? [];
                    }
                }

                api_json($orders);

            case 'categories':
                $categories = api_query_all(
                    $pdo,
                    'SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive, c.created_at AS createdAt, c.updated_at AS updatedAt, COUNT(p.id) AS productCount
                     FROM categories c
                     LEFT JOIN products p ON p.category_id = c.id
                     GROUP BY c.id
                     ORDER BY c.name ASC'
                );

                foreach ($categories as &$category) {
                    $category['isActive'] = (bool) $category['isActive'];
                    $category['productCount'] = (int) $category['productCount'];
                }

                api_json($categories);

            case 'notifications':
                $since = trim((string) ($_GET['since'] ?? ''));
                $sql = 'SELECT n.id, n.title, n.body, n.user_id AS userId, n.vendor_id AS vendorId, n.product_id AS productId, n.is_read AS isRead, n.created_at AS createdAt,
                               u.name AS userName, u.email AS userEmail, v.name AS vendorName, v.location AS vendorLocation, p.name AS productName
                        FROM notifications n
                        LEFT JOIN users u ON u.id = n.user_id
                        LEFT JOIN vendors v ON v.id = n.vendor_id
                        LEFT JOIN products p ON p.id = n.product_id';
                $params = [];
                if ($since !== '') {
                    $sql .= ' WHERE n.created_at > :since';
                    $params['since'] = $since;
                }
                $sql .= ' ORDER BY n.created_at DESC LIMIT 50';

                $notifications = api_query_all($pdo, $sql, $params);
                foreach ($notifications as &$notification) {
                    $notification['userId'] = $notification['userId'] !== null ? (int) $notification['userId'] : null;
                    $notification['vendorId'] = $notification['vendorId'] !== null ? (int) $notification['vendorId'] : null;
                    $notification['productId'] = $notification['productId'] !== null ? (int) $notification['productId'] : null;
                    $notification['isRead'] = (bool) $notification['isRead'];
                    $notification['user'] = $notification['userName'] !== null ? [
                        'name' => $notification['userName'],
                        'email' => $notification['userEmail'],
                    ] : null;
                    $notification['vendor'] = $notification['vendorName'] !== null ? [
                        'name' => $notification['vendorName'],
                        'location' => $notification['vendorLocation'],
                    ] : null;
                    unset($notification['userName'], $notification['userEmail'], $notification['vendorName'], $notification['vendorLocation'], $notification['productName']);
                }

                api_json($notifications);

            case 'reviews':
                $status = trim((string) ($_GET['status'] ?? ''));
                $sql = 'SELECT r.id, r.product_id AS productId, r.user_id AS userId, r.user_name AS userName, r.rating, r.comment, r.status, r.created_at AS createdAt, r.updated_at AS updatedAt, p.name AS productName
                        FROM reviews r
                        LEFT JOIN products p ON p.id = r.product_id';
                $params = [];
                if ($status !== '') {
                    $sql .= ' WHERE r.status = :status';
                    $params['status'] = $status;
                }
                $sql .= ' ORDER BY r.created_at DESC, r.id DESC';

                $reviews = api_query_all($pdo, $sql, $params);
                foreach ($reviews as &$review) {
                    $review['productId'] = (int) $review['productId'];
                    $review['userId'] = $review['userId'] !== null ? (int) $review['userId'] : null;
                    $review['rating'] = (int) $review['rating'];
                }

                api_json($reviews);

            case 'complaints':
                $complaints = api_query_all(
                    $pdo,
                    'SELECT c.id, c.subject, c.description, c.status, c.product_id AS productId, c.vendor_id AS vendorId, c.created_at AS createdAt, c.updated_at AS updatedAt, p.name AS productName, v.name AS vendorName
                     FROM complaints c
                     LEFT JOIN products p ON p.id = c.product_id
                     LEFT JOIN vendors v ON v.id = c.vendor_id
                     ORDER BY c.created_at DESC, c.id DESC'
                );

                foreach ($complaints as &$complaint) {
                    $complaint['productId'] = (int) $complaint['productId'];
                    $complaint['vendorId'] = $complaint['vendorId'] !== null ? (int) $complaint['vendorId'] : null;
                }

                api_json($complaints);

            case 'warranty-claims':
                $claims = api_query_all(
                    $pdo,
                    'SELECT wc.id, wc.user_id AS userId, wc.product_id AS productId, wc.record_id AS recordId, wc.subject, wc.description, wc.status, wc.response, wc.created_at AS createdAt, wc.updated_at AS updatedAt, p.name AS productName, u.name AS userName
                     FROM warranty_claims wc
                     LEFT JOIN products p ON p.id = wc.product_id
                     LEFT JOIN users u ON u.id = wc.user_id
                     ORDER BY wc.created_at DESC, wc.id DESC'
                );

                foreach ($claims as &$claim) {
                    $claim['userId'] = (int) $claim['userId'];
                    $claim['productId'] = (int) $claim['productId'];
                    $claim['recordId'] = $claim['recordId'] !== null ? (int) $claim['recordId'] : null;
                }

                api_json($claims);
        }

        api_json([
            'resource' => $resource,
            'scope' => 'admin',
            'action' => $id ? 'show' : 'index',
            'id' => $id,
            'message' => 'No admin GET handler matched this resource.',
        ]);
    }

    switch ($method) {
        case 'POST':
            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'create',
                'received' => api_input(),
                'message' => 'Replace this stub with admin INSERT logic.',
            ], 201);

        case 'PUT':
        case 'PATCH':
            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'update',
                'id' => $id,
                'received' => api_input(),
                'message' => 'Replace this stub with admin UPDATE logic.',
            ]);

        case 'DELETE':
            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'delete',
                'id' => $id,
                'message' => 'Replace this stub with admin DELETE logic.',
            ]);

        default:
            api_method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    }
}
