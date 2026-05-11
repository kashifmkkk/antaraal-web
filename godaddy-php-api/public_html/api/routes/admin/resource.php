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

            case 'rfqs':
                $rfqs = api_query_all(
                    $pdo,
                    'SELECT r.id,
                            COALESCE(NULLIF(r.part_number, \'\'), \'General Inquiry\') AS productName,
                            1 AS quantity,
                            r.name AS buyerName,
                            COALESCE(NULLIF(r.company, \'\'), \'N/A\') AS buyerCompany,
                            r.email AS buyerEmail,
                            r.status,
                            r.internal_notes AS notes,
                            v.name AS assignedVendor,
                            r.created_at AS createdAt
                     FROM rfqs r
                     LEFT JOIN vendors v ON v.id = r.assigned_vendor_id
                     ORDER BY r.created_at DESC, r.id DESC'
                );

                foreach ($rfqs as &$rfq) {
                    $rfq['id'] = (int) $rfq['id'];
                    $rfq['quantity'] = (int) ($rfq['quantity'] ?? 1);
                }

                api_json($rfqs);

            case 'quotes':
                $quotes = api_query_all(
                    $pdo,
                    'SELECT q.id,
                            q.rfq_id AS rfqId,
                            COALESCE(v.name, u.name, \'Unassigned\') AS vendor,
                            q.amount AS totalValue,
                            q.currency,
                            q.status,
                            q.issued_at AS issuedAt,
                            q.valid_until AS validUntil
                     FROM quotes q
                     LEFT JOIN vendors v ON v.id = q.vendor_id
                     LEFT JOIN users u ON u.id = q.user_id
                     ORDER BY q.created_at DESC, q.id DESC'
                );

                foreach ($quotes as &$quote) {
                    $quote['id'] = (int) $quote['id'];
                    $quote['rfqId'] = (int) $quote['rfqId'];
                    $quote['totalValue'] = (float) $quote['totalValue'];
                }

                api_json($quotes);

            case 'mro':
                $mro = api_query_all(
                    $pdo,
                    'SELECT id, tail_number AS tailNumber, provider, service_type AS serviceType, status, estimated_tat_days AS estimatedTatDays, start_date AS startDate
                     FROM mro_orders
                     ORDER BY start_date DESC, id DESC'
                );

                foreach ($mro as &$row) {
                    $row['id'] = (int) $row['id'];
                    $row['estimatedTatDays'] = (int) $row['estimatedTatDays'];
                }

                api_json($mro);

            case 'settings':
                $rows = api_query_all(
                    $pdo,
                    'SELECT id, notification_email AS notificationEmail, rfq_auto_assign AS rfqAutoAssign, daily_digest AS dailyDigest, compliance_notes AS complianceNotes
                     FROM admin_settings
                     WHERE id = 1
                     LIMIT 1'
                );

                $settings = $rows[0] ?? null;
                if (!$settings) {
                    $stmt = $pdo->prepare('INSERT INTO admin_settings (id, notification_email, rfq_auto_assign, daily_digest, compliance_notes) VALUES (1, :notificationEmail, :rfqAutoAssign, :dailyDigest, :complianceNotes)');
                    $stmt->execute([
                        ':notificationEmail' => 'ops@skyway.aero',
                        ':rfqAutoAssign' => 0,
                        ':dailyDigest' => 0,
                        ':complianceNotes' => '',
                    ]);
                    $settings = [
                        'id' => 1,
                        'notificationEmail' => 'ops@skyway.aero',
                        'rfqAutoAssign' => 0,
                        'dailyDigest' => 0,
                        'complianceNotes' => '',
                    ];
                }

                $settings['rfqAutoAssign'] = (bool) $settings['rfqAutoAssign'];
                $settings['dailyDigest'] = (bool) $settings['dailyDigest'];
                api_json($settings);

            case 'notifications':
                if (($segments[0] ?? '') === 'stream') {
                    header('Content-Type: text/event-stream');
                    header('Cache-Control: no-cache');
                    header('Connection: keep-alive');

                    $lastCheck = date('Y-m-d H:i:s', strtotime('-5 minutes'));
                    for ($i = 0; $i < 6; $i++) {
                        $rows = api_query_all(
                            $pdo,
                            'SELECT id, title, body, created_at AS createdAt
                             FROM notifications
                             WHERE created_at > :lastCheck
                             ORDER BY created_at ASC
                             LIMIT 20',
                            ['lastCheck' => $lastCheck]
                        );

                        foreach ($rows as $row) {
                            $payload = [
                                'id' => (string) $row['id'],
                                'title' => $row['title'],
                                'body' => $row['body'] ?? '',
                                'level' => 'info',
                                'createdAt' => $row['createdAt'],
                            ];
                            echo 'data: ' . json_encode($payload) . "\n\n";
                            $lastCheck = $row['createdAt'];
                        }

                        echo ": keepalive\n\n";
                        if (function_exists('ob_flush')) {
                            @ob_flush();
                        }
                        @flush();
                        sleep(5);
                    }

                    exit;
                }

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

            case 'warranty':
                $records = api_query_all(
                    $pdo,
                    'SELECT wr.id, wr.expiry_date AS expiryDate, wr.status, wr.tail_number AS tailNumber,
                            p.name AS productName, COALESCE(v.name, p.vendor, \'Unknown\') AS vendor
                     FROM warranty_records wr
                     INNER JOIN products p ON p.id = wr.product_id
                     LEFT JOIN vendors v ON v.id = wr.vendor_id
                     ORDER BY wr.expiry_date ASC, wr.id ASC'
                );

                foreach ($records as &$record) {
                    $record['id'] = (string) $record['id'];
                    if (!in_array($record['status'], ['Active', 'Expiring', 'Expired'], true)) {
                        $record['status'] = 'Active';
                    }
                }

                api_json($records);
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
            if ($resource === 'categories' && $id !== null && (($segments[1] ?? '') === 'assign-product')) {
                $input = api_input();
                $productId = isset($input['productId']) ? (int) $input['productId'] : 0;
                if ($productId <= 0) {
                    api_json(['error' => 'productId is required'], 400);
                }

                $category = api_query_all($pdo, 'SELECT id FROM categories WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($category)) {
                    api_json(['error' => 'Category not found'], 404);
                }

                $product = api_query_all($pdo, 'SELECT id FROM products WHERE id = :id LIMIT 1', ['id' => $productId]);
                if (empty($product)) {
                    api_json(['error' => 'Product not found'], 404);
                }

                $stmt = $pdo->prepare('UPDATE products SET category_id = :categoryId, updated_at = NOW() WHERE id = :productId');
                $stmt->execute([':categoryId' => $id, ':productId' => $productId]);

                $countRow = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $id]);
                $count = (int) ($countRow[0]['total'] ?? 0);
                $pdo->prepare('UPDATE categories SET product_count = :count, updated_at = NOW() WHERE id = :id')->execute([':count' => $count, ':id' => $id]);

                $updatedProduct = api_query_all($pdo, 'SELECT id, name, category_id AS categoryId, updated_at AS updatedAt FROM products WHERE id = :id', ['id' => $productId]);
                api_json($updatedProduct[0] ?? ['id' => $productId, 'categoryId' => $id]);
            }

            if ($resource === 'categories') {
                $input = api_input();
                $name = trim((string) ($input['name'] ?? ''));
                $slug = trim((string) ($input['slug'] ?? ''));
                $description = isset($input['description']) ? trim((string) $input['description']) : null;
                $isActive = isset($input['isActive']) ? (bool) $input['isActive'] : true;

                if ($name === '' || $slug === '') {
                    api_json(['error' => 'Name and slug are required'], 400);
                }

                $existing = api_query_all(
                    $pdo,
                    'SELECT id FROM categories WHERE name = :name OR slug = :slug LIMIT 1',
                    ['name' => $name, 'slug' => $slug]
                );
                if (!empty($existing)) {
                    api_json(['error' => 'Category with this name or slug already exists'], 400);
                }

                $stmt = $pdo->prepare('INSERT INTO categories (name, slug, description, product_count, is_active, created_at, updated_at) VALUES (:name, :slug, :description, 0, :isActive, NOW(), NOW())');
                $stmt->execute([
                    ':name' => $name,
                    ':slug' => $slug,
                    ':description' => $description,
                    ':isActive' => (int) $isActive,
                ]);

                $newId = (int) $pdo->lastInsertId();
                $created = api_query_all(
                    $pdo,
                    'SELECT id, name, slug, description, product_count AS productCount, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
                     FROM categories
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $newId]
                );
                $row = $created[0] ?? null;
                if ($row) {
                    $row['isActive'] = (bool) $row['isActive'];
                    $row['productCount'] = (int) $row['productCount'];
                }

                api_json($row, 201);
            }

            if ($resource === 'inventory') {
                $input = api_input();
                $productId = trim((string) ($input['productId'] ?? ''));
                $name = trim((string) ($input['name'] ?? ''));
                $category = trim((string) ($input['category'] ?? ''));
                $vendor = trim((string) ($input['vendor'] ?? ''));
                $categoryId = isset($input['categoryId']) && $input['categoryId'] !== '' ? (int) $input['categoryId'] : null;
                $availability = trim((string) ($input['availability'] ?? 'On Request'));
                $warrantyStatus = trim((string) ($input['warrantyStatus'] ?? 'Active'));
                $warranty = trim((string) ($input['warranty'] ?? ($warrantyStatus === 'Expired' ? 'Expired' : 'Standard')));
                $description = isset($input['description']) ? trim((string) $input['description']) : null;
                $price = isset($input['price']) ? (string) $input['price'] : null;
                $status = trim((string) ($input['status'] ?? 'available'));
                $photos = is_array($input['photos'] ?? null) ? array_values(array_filter($input['photos'])) : [];
                $image = isset($input['image']) ? (string) $input['image'] : null;
                if (!empty($photos)) {
                    $image = (string) $photos[count($photos) - 1];
                }
                if (!$image) {
                    $image = '/placeholder.svg';
                }

                if ($productId === '' || $name === '' || $category === '' || $vendor === '') {
                    api_json(['error' => 'missing required fields'], 400);
                }

                $stmt = $pdo->prepare(
                    'INSERT INTO products (reference_code, name, category, category_id, vendor, availability, warranty_status, warranty, image, photos, description, price, status, created_at, updated_at)
                     VALUES (:referenceCode, :name, :category, :categoryId, :vendor, :availability, :warrantyStatus, :warranty, :image, :photos, :description, :price, :status, NOW(), NOW())'
                );
                $stmt->execute([
                    ':referenceCode' => $productId,
                    ':name' => $name,
                    ':category' => $category,
                    ':categoryId' => $categoryId,
                    ':vendor' => $vendor,
                    ':availability' => $availability,
                    ':warrantyStatus' => $warrantyStatus,
                    ':warranty' => $warranty,
                    ':image' => $image,
                    ':photos' => json_encode($photos),
                    ':description' => $description,
                    ':price' => $price,
                    ':status' => $status,
                ]);

                $newId = (int) $pdo->lastInsertId();

                if ($categoryId !== null) {
                    $countRow = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $categoryId]);
                    $count = (int) ($countRow[0]['total'] ?? 0);
                    $pdo->prepare('UPDATE categories SET product_count = :count, updated_at = NOW() WHERE id = :id')->execute([':count' => $count, ':id' => $categoryId]);
                }

                $created = api_query_all(
                    $pdo,
                    'SELECT id, reference_code AS productId, name, category, category_id AS categoryId, vendor, availability, warranty_status AS warrantyStatus, warranty, image, photos, price, created_at AS createdAt, updated_at AS updatedAt
                     FROM products
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $newId]
                );
                $row = $created[0] ?? null;
                if ($row) {
                    $row['id'] = (string) $row['id'];
                    $row['categoryId'] = $row['categoryId'] !== null ? (int) $row['categoryId'] : null;
                    $row['photos'] = api_json_decode_array($row['photos'] ?? null);
                }

                api_json($row, 201);
            }

            if ($resource === 'notifications') {
                $input = api_input();
                $title = trim((string) ($input['title'] ?? ''));
                $body = isset($input['body']) ? trim((string) $input['body']) : null;
                $recipientType = trim((string) ($input['recipientType'] ?? ''));
                $recipientIds = is_array($input['recipientIds'] ?? null) ? $input['recipientIds'] : [];
                $productId = isset($input['productId']) ? (int) $input['productId'] : null;

                if ($title === '') {
                    api_json(['error' => 'title is required'], 400);
                }

                if (!in_array($recipientType, ['user', 'vendor', 'all_users', 'all_vendors'], true)) {
                    api_json(['error' => 'recipientType must be user, vendor, all_users, or all_vendors'], 400);
                }

                $created = 0;
                if ($recipientType === 'all_users') {
                    $users = api_query_all($pdo, 'SELECT id FROM users');
                    $stmt = $pdo->prepare('INSERT INTO notifications (title, body, user_id, product_id, created_at) VALUES (:title, :body, :userId, :productId, NOW())');
                    foreach ($users as $user) {
                        $stmt->execute([
                            ':title' => $title,
                            ':body' => $body,
                            ':userId' => (int) $user['id'],
                            ':productId' => $productId,
                        ]);
                        $created++;
                    }
                } elseif ($recipientType === 'all_vendors') {
                    $vendors = api_query_all($pdo, 'SELECT id FROM vendors');
                    $stmt = $pdo->prepare('INSERT INTO notifications (title, body, vendor_id, product_id, created_at) VALUES (:title, :body, :vendorId, :productId, NOW())');
                    foreach ($vendors as $vendor) {
                        $stmt->execute([
                            ':title' => $title,
                            ':body' => $body,
                            ':vendorId' => (int) $vendor['id'],
                            ':productId' => $productId,
                        ]);
                        $created++;
                    }
                } else {
                    if (empty($recipientIds)) {
                        api_json(['error' => 'recipientIds array is required for user/vendor recipientType'], 400);
                    }

                    if ($recipientType === 'user') {
                        $stmt = $pdo->prepare('INSERT INTO notifications (title, body, user_id, product_id, created_at) VALUES (:title, :body, :userId, :productId, NOW())');
                        foreach ($recipientIds as $recipientId) {
                            $stmt->execute([
                                ':title' => $title,
                                ':body' => $body,
                                ':userId' => (int) $recipientId,
                                ':productId' => $productId,
                            ]);
                            $created++;
                        }
                    } else {
                        $stmt = $pdo->prepare('INSERT INTO notifications (title, body, vendor_id, product_id, created_at) VALUES (:title, :body, :vendorId, :productId, NOW())');
                        foreach ($recipientIds as $recipientId) {
                            $stmt->execute([
                                ':title' => $title,
                                ':body' => $body,
                                ':vendorId' => (int) $recipientId,
                                ':productId' => $productId,
                            ]);
                            $created++;
                        }
                    }
                }

                api_json(['success' => true, 'count' => $created]);
            }

            if ($resource === 'uploads' && (($segments[0] ?? '') === 'presign')) {
                $input = api_input();
                $files = $input['files'] ?? null;
                if (!is_array($files) || empty($files)) {
                    api_json(['error' => 'files array required'], 400);
                }

                api_json(['error' => 'presigned uploads not configured - use POST /api/admin/uploads'], 501);
            }

            if ($resource === 'uploads') {
                if (!isset($_FILES['files'])) {
                    api_json(['error' => 'no files uploaded'], 400);
                }

                $uploadsDir = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'uploads';
                if (!is_dir($uploadsDir)) {
                    @mkdir($uploadsDir, 0775, true);
                }

                if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
                    api_json(['error' => 'uploads directory is not writable'], 500);
                }

                $urls = [];
                $names = $_FILES['files']['name'];
                $tmpNames = $_FILES['files']['tmp_name'];
                $errors = $_FILES['files']['error'];

                if (!is_array($names)) {
                    $names = [$names];
                    $tmpNames = [$tmpNames];
                    $errors = [$errors];
                }

                foreach ($names as $idx => $originalName) {
                    if (($errors[$idx] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                        continue;
                    }
                    $tmp = $tmpNames[$idx] ?? null;
                    if (!$tmp || !is_uploaded_file($tmp)) {
                        continue;
                    }

                    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', (string) $originalName);
                    $fileName = time() . '-' . mt_rand(1000, 9999) . '-' . $safeName;
                    $target = $uploadsDir . DIRECTORY_SEPARATOR . $fileName;

                    if (@move_uploaded_file($tmp, $target)) {
                        $urls[] = '/uploads/' . $fileName;
                    }
                }

                if (empty($urls)) {
                    api_json(['error' => 'no files uploaded'], 400);
                }

                api_json(['urls' => $urls]);
            }

            if ($resource === 'warranty' && $id !== null && (($segments[1] ?? '') === 'refresh')) {
                $recordRows = api_query_all(
                    $pdo,
                    'SELECT wr.id, wr.expiry_date AS expiryDate, wr.status, wr.tail_number AS tailNumber,
                            p.name AS productName, COALESCE(v.name, p.vendor, \'Unknown\') AS vendor
                     FROM warranty_records wr
                     INNER JOIN products p ON p.id = wr.product_id
                     LEFT JOIN vendors v ON v.id = wr.vendor_id
                     WHERE wr.id = :id
                     LIMIT 1',
                    ['id' => $id]
                );

                $record = $recordRows[0] ?? null;
                if (!$record) {
                    api_json(['error' => 'not_found'], 404);
                }

                $record['id'] = (string) $record['id'];
                if (!in_array($record['status'], ['Active', 'Expiring', 'Expired'], true)) {
                    $record['status'] = 'Active';
                }
                $record['reminderSentAt'] = gmdate('c');

                api_json($record);
            }

            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'create',
                'received' => api_input(),
                'message' => 'No admin POST handler matched this resource.',
            ], 404);

        case 'PUT':
        case 'PATCH':
            if ($resource === 'settings') {
                $input = api_input();
                $notificationEmail = trim((string) ($input['notificationEmail'] ?? ''));
                $rfqAutoAssign = isset($input['rfqAutoAssign']) ? (bool) $input['rfqAutoAssign'] : false;
                $dailyDigest = isset($input['dailyDigest']) ? (bool) $input['dailyDigest'] : false;
                $complianceNotes = isset($input['complianceNotes']) ? trim((string) $input['complianceNotes']) : '';

                if ($notificationEmail === '') {
                    api_json(['error' => 'notificationEmail required'], 400);
                }

                $exists = api_query_all($pdo, 'SELECT id FROM admin_settings WHERE id = 1 LIMIT 1');
                if (empty($exists)) {
                    $pdo->prepare('INSERT INTO admin_settings (id, notification_email, rfq_auto_assign, daily_digest, compliance_notes) VALUES (1, :notificationEmail, :rfqAutoAssign, :dailyDigest, :complianceNotes)')
                        ->execute([
                            ':notificationEmail' => $notificationEmail,
                            ':rfqAutoAssign' => (int) $rfqAutoAssign,
                            ':dailyDigest' => (int) $dailyDigest,
                            ':complianceNotes' => $complianceNotes,
                        ]);
                } else {
                    $pdo->prepare('UPDATE admin_settings SET notification_email = :notificationEmail, rfq_auto_assign = :rfqAutoAssign, daily_digest = :dailyDigest, compliance_notes = :complianceNotes WHERE id = 1')
                        ->execute([
                            ':notificationEmail' => $notificationEmail,
                            ':rfqAutoAssign' => (int) $rfqAutoAssign,
                            ':dailyDigest' => (int) $dailyDigest,
                            ':complianceNotes' => $complianceNotes,
                        ]);
                }

                api_json([
                    'id' => 1,
                    'notificationEmail' => $notificationEmail,
                    'rfqAutoAssign' => $rfqAutoAssign,
                    'dailyDigest' => $dailyDigest,
                    'complianceNotes' => $complianceNotes,
                ]);
            }

            if ($resource === 'inventory' && $id !== null && (($segments[1] ?? '') === 'availability')) {
                $input = api_input();
                $availability = trim((string) ($input['availability'] ?? ''));
                if ($availability === '') {
                    api_json(['error' => 'availability required'], 400);
                }
                $pdo->prepare('UPDATE products SET availability = :availability, updated_at = NOW() WHERE id = :id')->execute([':availability' => $availability, ':id' => $id]);
                $updated = api_query_all(
                    $pdo,
                    'SELECT id, reference_code AS productId, name, category, category_id AS categoryId, vendor, availability, warranty_status AS warrantyStatus, image, photos, price, created_at AS createdAt, updated_at AS updatedAt
                     FROM products
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $id]
                );
                $row = $updated[0] ?? null;
                if ($row) {
                    $row['id'] = (string) $row['id'];
                    $row['categoryId'] = $row['categoryId'] !== null ? (int) $row['categoryId'] : null;
                    $row['photos'] = api_json_decode_array($row['photos'] ?? null);
                }
                api_json($row);
            }

            if ($resource === 'inventory' && $id !== null) {
                $existing = api_query_all($pdo, 'SELECT id, category_id AS categoryId FROM products WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($existing)) {
                    api_json(['error' => 'not_found'], 404);
                }
                $oldCategoryId = $existing[0]['categoryId'] !== null ? (int) $existing[0]['categoryId'] : null;

                $input = api_input();
                $sets = [];
                $params = [':id' => $id];

                $fieldMap = [
                    'productId' => 'reference_code',
                    'name' => 'name',
                    'category' => 'category',
                    'categoryId' => 'category_id',
                    'vendor' => 'vendor',
                    'availability' => 'availability',
                    'warrantyStatus' => 'warranty_status',
                    'warranty' => 'warranty',
                    'description' => 'description',
                    'price' => 'price',
                    'status' => 'status',
                    'image' => 'image',
                ];

                foreach ($fieldMap as $inputKey => $column) {
                    if (array_key_exists($inputKey, $input)) {
                        $sets[] = $column . ' = :' . $inputKey;
                        $params[':' . $inputKey] = $input[$inputKey];
                    }
                }

                if (array_key_exists('photos', $input) && is_array($input['photos'])) {
                    $photos = array_values(array_filter($input['photos']));
                    $sets[] = 'photos = :photos';
                    $params[':photos'] = json_encode($photos);
                    if (!empty($photos)) {
                        $sets[] = 'image = :imageFromPhotos';
                        $params[':imageFromPhotos'] = (string) $photos[count($photos) - 1];
                    }
                }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }

                $sets[] = 'updated_at = NOW()';
                $sql = 'UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = :id';
                $pdo->prepare($sql)->execute($params);

                $newCategoryId = null;
                if (array_key_exists('categoryId', $input) && $input['categoryId'] !== null && $input['categoryId'] !== '') {
                    $newCategoryId = (int) $input['categoryId'];
                } elseif (array_key_exists('categoryId', $input) && ($input['categoryId'] === null || $input['categoryId'] === '')) {
                    $newCategoryId = null;
                } else {
                    $newCategoryId = $oldCategoryId;
                }

                if ($newCategoryId !== $oldCategoryId) {
                    if ($oldCategoryId !== null) {
                        $oldCount = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $oldCategoryId]);
                        $pdo->prepare('UPDATE categories SET product_count = :count, updated_at = NOW() WHERE id = :id')->execute([':count' => (int) ($oldCount[0]['total'] ?? 0), ':id' => $oldCategoryId]);
                    }
                    if ($newCategoryId !== null) {
                        $newCount = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $newCategoryId]);
                        $pdo->prepare('UPDATE categories SET product_count = :count, updated_at = NOW() WHERE id = :id')->execute([':count' => (int) ($newCount[0]['total'] ?? 0), ':id' => $newCategoryId]);
                    }
                }

                $updated = api_query_all(
                    $pdo,
                    'SELECT id, reference_code AS productId, name, category, category_id AS categoryId, vendor, availability, warranty_status AS warrantyStatus, warranty, image, photos, price, created_at AS createdAt, updated_at AS updatedAt
                     FROM products
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $id]
                );
                $row = $updated[0] ?? null;
                if ($row) {
                    $row['id'] = (string) $row['id'];
                    $row['categoryId'] = $row['categoryId'] !== null ? (int) $row['categoryId'] : null;
                    $row['photos'] = api_json_decode_array($row['photos'] ?? null);
                }
                api_json($row);
            }

            if ($resource === 'orders' && $id !== null) {
                $input = api_input();
                $sets = [];
                $params = [':id' => $id];
                $existingOrderRows = api_query_all($pdo, 'SELECT id, status FROM orders WHERE id = :id LIMIT 1', ['id' => $id]);
                $existingOrder = $existingOrderRows[0] ?? null;
                if (!$existingOrder) {
                    api_json(['error' => 'not_found'], 404);
                }
                $wasDelivered = strcasecmp((string) ($existingOrder['status'] ?? ''), 'Delivered') === 0;

                if (!empty($input['status'])) {
                    $sets[] = 'status = :status';
                    $params[':status'] = $input['status'];
                    if ($input['status'] === 'Shipped') {
                        $sets[] = 'shipped_at = NOW()';
                    }
                    if ($input['status'] === 'Delivered') {
                        $sets[] = 'delivered_at = NOW()';
                    }
                }

                if (array_key_exists('paymentStatus', $input)) {
                    $sets[] = 'payment_status = :paymentStatus';
                    $params[':paymentStatus'] = $input['paymentStatus'];
                }
                if (array_key_exists('trackingNumber', $input)) {
                    $sets[] = 'tracking_number = :trackingNumber';
                    $params[':trackingNumber'] = $input['trackingNumber'];
                }
                if (array_key_exists('shippingCarrier', $input)) {
                    $sets[] = 'shipping_carrier = :shippingCarrier';
                    $params[':shippingCarrier'] = $input['shippingCarrier'];
                }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }

                $sets[] = 'updated_at = NOW()';
                $pdo->prepare('UPDATE orders SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);

                $isNowDelivered = isset($params[':status']) && strcasecmp((string) $params[':status'], 'Delivered') === 0;
                if (!$wasDelivered && $isNowDelivered) {
                    $orderItemsForWarranty = api_query_all(
                        $pdo,
                        'SELECT oi.product_id AS productId,
                                oi.quantity,
                                p.vendor AS vendorName,
                                p.warranty,
                                p.warranty_status AS warrantyStatus,
                                v.id AS vendorId
                         FROM order_items oi
                         INNER JOIN products p ON p.id = oi.product_id
                         LEFT JOIN vendors v ON v.name = p.vendor
                         WHERE oi.order_id = :orderId',
                        ['orderId' => $id]
                    );

                    foreach ($orderItemsForWarranty as $warrantyItem) {
                        $warrantyText = trim((string) ($warrantyItem['warranty'] ?? ''));
                        $warrantyStatus = strtolower(trim((string) ($warrantyItem['warrantyStatus'] ?? 'active')));

                        if ($warrantyText === '' || in_array($warrantyStatus, ['expired', 'none', 'no warranty'], true)) {
                            continue;
                        }

                        $durationDays = 365;
                        if (preg_match('/(\d+)\s*(day|days|month|months|year|years)/i', $warrantyText, $matches)) {
                            $value = (int) ($matches[1] ?? 0);
                            $unit = strtolower((string) ($matches[2] ?? ''));

                            if ($value > 0) {
                                if (strpos($unit, 'day') === 0) {
                                    $durationDays = $value;
                                } elseif (strpos($unit, 'month') === 0) {
                                    $durationDays = $value * 30;
                                } else {
                                    $durationDays = $value * 365;
                                }
                            }
                        }

                        $expiryDate = date('Y-m-d H:i:s', strtotime('+' . $durationDays . ' days'));
                        $quantity = max(1, (int) ($warrantyItem['quantity'] ?? 1));

                        $insertWarranty = $pdo->prepare(
                            'INSERT INTO warranty_records (product_id, vendor_id, tail_number, expiry_date, status, created_at)
                             VALUES (:productId, :vendorId, :tailNumber, :expiryDate, :status, NOW())'
                        );

                        for ($i = 0; $i < $quantity; $i++) {
                            $insertWarranty->execute([
                                ':productId' => (int) $warrantyItem['productId'],
                                ':vendorId' => $warrantyItem['vendorId'] !== null ? (int) $warrantyItem['vendorId'] : null,
                                ':tailNumber' => null,
                                ':expiryDate' => $expiryDate,
                                ':status' => 'Active',
                            ]);
                        }
                    }
                }

                $updated = api_query_all(
                    $pdo,
                    'SELECT id, user_id AS userId, order_number AS orderNumber, total_amount AS totalAmount, currency, status, shipping_address AS shippingAddress, billing_address AS billingAddress, payment_method AS paymentMethod, payment_status AS paymentStatus, tracking_number AS trackingNumber, shipping_carrier AS shippingCarrier, shipped_at AS shippedAt, delivered_at AS deliveredAt, created_at AS createdAt, updated_at AS updatedAt
                     FROM orders
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $id]
                );
                $order = $updated[0] ?? null;
                if (!$order) {
                    api_json(['error' => 'not_found'], 404);
                }
                $order['userId'] = (int) $order['userId'];
                $order['totalAmount'] = (float) $order['totalAmount'];

                $items = api_query_all($pdo, 'SELECT id, order_id AS orderId, product_id AS productId, quantity, price FROM order_items WHERE order_id = :id ORDER BY id ASC', ['id' => $id]);
                foreach ($items as &$item) {
                    unset($item['orderId']);
                    $item['productId'] = (int) $item['productId'];
                    $item['quantity'] = (int) $item['quantity'];
                    $item['price'] = (float) $item['price'];
                }
                $order['items'] = $items;
                api_json($order);
            }

            if ($resource === 'vendors' && $id !== null && (($segments[1] ?? '') === 'verification')) {
                $input = api_input();
                $status = trim((string) ($input['status'] ?? ''));
                if (!in_array($status, ['Verified', 'Pending', 'Rejected'], true)) {
                    api_json(['error' => 'invalid status'], 400);
                }
                $pdo->prepare('UPDATE vendors SET verification_status = :status, updated_at = NOW() WHERE id = :id')->execute([':status' => $status, ':id' => $id]);
                api_json(['id' => $id, 'verificationStatus' => $status]);
            }

            if ($resource === 'vendors' && $id !== null && (($segments[1] ?? '') === 'status')) {
                $input = api_input();
                if (!array_key_exists('isActive', $input)) {
                    api_json(['error' => 'isActive required'], 400);
                }
                $isActive = (bool) $input['isActive'];
                $pdo->prepare('UPDATE vendors SET is_active = :isActive, updated_at = NOW() WHERE id = :id')->execute([':isActive' => (int) $isActive, ':id' => $id]);
                api_json(['id' => $id, 'isActive' => $isActive]);
            }

            if ($resource === 'users' && $id !== null && (($segments[1] ?? '') === 'role')) {
                $input = api_input();
                $role = trim((string) ($input['role'] ?? ''));
                if (!in_array($role, ['ADMIN', 'VENDOR', 'BUYER'], true)) {
                    api_json(['error' => 'invalid role'], 400);
                }
                $pdo->prepare('UPDATE users SET role = :role WHERE id = :id')->execute([':role' => $role, ':id' => $id]);
                api_json(['id' => $id, 'role' => $role]);
            }

            if ($resource === 'users' && $id !== null && (($segments[1] ?? '') === 'status')) {
                $input = api_input();
                if (!array_key_exists('isActive', $input)) {
                    api_json(['error' => 'isActive required'], 400);
                }
                $isActive = (bool) $input['isActive'];
                $pdo->prepare('UPDATE users SET is_active = :isActive, last_active_at = NOW() WHERE id = :id')->execute([':isActive' => (int) $isActive, ':id' => $id]);
                api_json(['id' => $id, 'isActive' => $isActive]);
            }

            if ($resource === 'reviews' && $id !== null && (($segments[1] ?? '') === 'approve')) {
                $pdo->prepare('UPDATE reviews SET status = :status, updated_at = NOW() WHERE id = :id')->execute([':status' => 'Approved', ':id' => $id]);
                $review = api_query_all($pdo, 'SELECT id, product_id AS productId, user_id AS userId, user_name AS userName, rating, comment, status, created_at AS createdAt, updated_at AS updatedAt FROM reviews WHERE id = :id LIMIT 1', ['id' => $id]);
                api_json($review[0] ?? ['id' => $id, 'status' => 'Approved']);
            }

            if ($resource === 'reviews' && $id !== null && (($segments[1] ?? '') === 'reject')) {
                $pdo->prepare('UPDATE reviews SET status = :status, updated_at = NOW() WHERE id = :id')->execute([':status' => 'Rejected', ':id' => $id]);
                $review = api_query_all($pdo, 'SELECT id, product_id AS productId, user_id AS userId, user_name AS userName, rating, comment, status, created_at AS createdAt, updated_at AS updatedAt FROM reviews WHERE id = :id LIMIT 1', ['id' => $id]);
                api_json($review[0] ?? ['id' => $id, 'status' => 'Rejected']);
            }

            if ($resource === 'complaints' && $id !== null) {
                $input = api_input();
                $sets = [];
                $params = [':id' => $id];
                if (array_key_exists('status', $input)) {
                    $status = trim((string) $input['status']);
                    if (!in_array($status, ['New', 'In Review', 'Resolved', 'Closed'], true)) {
                        api_json(['error' => 'invalid status'], 400);
                    }
                    $sets[] = 'status = :status';
                    $params[':status'] = $status;
                }
                if (array_key_exists('description', $input)) {
                    $sets[] = 'description = :description';
                    $params[':description'] = $input['description'];
                }
                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }
                $sets[] = 'updated_at = NOW()';
                $pdo->prepare('UPDATE complaints SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
                $row = api_query_all($pdo, 'SELECT id, status, updated_at AS updatedAt FROM complaints WHERE id = :id LIMIT 1', ['id' => $id]);
                api_json($row[0] ?? ['id' => $id]);
            }

            if ($resource === 'rfqs' && $id !== null) {
                $input = api_input();
                $sets = [];
                $params = [':id' => $id];

                if (array_key_exists('status', $input)) {
                    $status = trim((string) $input['status']);
                    if (!in_array($status, ['New', 'In Review', 'Quoted', 'Closed'], true)) {
                        api_json(['error' => 'invalid status'], 400);
                    }
                    $sets[] = 'status = :status';
                    $params[':status'] = $status;
                }

                if (array_key_exists('internalNotes', $input)) {
                    $sets[] = 'internal_notes = :internalNotes';
                    $params[':internalNotes'] = $input['internalNotes'];
                }

                if (array_key_exists('assignedVendorId', $input)) {
                    $sets[] = 'assigned_vendor_id = :assignedVendorId';
                    $params[':assignedVendorId'] = $input['assignedVendorId'] !== null ? (int) $input['assignedVendorId'] : null;
                }

                if (array_key_exists('assignedVendor', $input)) {
                    $vendorName = trim((string) $input['assignedVendor']);
                    if ($vendorName === '') {
                        $sets[] = 'assigned_vendor_id = :assignedVendorIdFromName';
                        $params[':assignedVendorIdFromName'] = null;
                    } else {
                        $vendor = api_query_all($pdo, 'SELECT id FROM vendors WHERE name = :name LIMIT 1', ['name' => $vendorName]);
                        if (!empty($vendor)) {
                            $sets[] = 'assigned_vendor_id = :assignedVendorIdFromName';
                            $params[':assignedVendorIdFromName'] = (int) $vendor[0]['id'];
                        }
                    }
                }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }

                $pdo->prepare('UPDATE rfqs SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);

                $rfq = api_query_all(
                    $pdo,
                    'SELECT r.id,
                            COALESCE(NULLIF(r.part_number, \'\'), \'General Inquiry\') AS productName,
                            1 AS quantity,
                            r.name AS buyerName,
                            COALESCE(NULLIF(r.company, \'\'), \'N/A\') AS buyerCompany,
                            r.email AS buyerEmail,
                            r.status,
                            r.internal_notes AS notes,
                            v.name AS assignedVendor,
                            r.created_at AS createdAt
                     FROM rfqs r
                     LEFT JOIN vendors v ON v.id = r.assigned_vendor_id
                     WHERE r.id = :id
                     LIMIT 1',
                    ['id' => $id]
                );
                api_json($rfq[0] ?? ['id' => $id]);
            }

            if ($resource === 'quotes' && $id !== null) {
                $input = api_input();
                $status = trim((string) ($input['status'] ?? ''));
                if (!in_array($status, ['Draft', 'Sent', 'Accepted', 'Declined'], true)) {
                    api_json(['error' => 'invalid status'], 400);
                }

                $pdo->prepare('UPDATE quotes SET status = :status WHERE id = :id')->execute([':status' => $status, ':id' => $id]);
                $quote = api_query_all($pdo, 'SELECT id, status FROM quotes WHERE id = :id LIMIT 1', ['id' => $id]);
                api_json($quote[0] ?? ['id' => $id, 'status' => $status]);
            }

            if ($resource === 'mro' && $id !== null) {
                $input = api_input();
                $status = trim((string) ($input['status'] ?? ''));
                if (!in_array($status, ['Scheduled', 'In Progress', 'Awaiting Approval', 'Released'], true)) {
                    api_json(['error' => 'invalid status'], 400);
                }

                $pdo->prepare('UPDATE mro_orders SET status = :status, updated_at = NOW() WHERE id = :id')->execute([':status' => $status, ':id' => $id]);
                $mro = api_query_all($pdo, 'SELECT id, tail_number AS tailNumber, provider, service_type AS serviceType, status, estimated_tat_days AS estimatedTatDays, start_date AS startDate FROM mro_orders WHERE id = :id LIMIT 1', ['id' => $id]);
                $row = $mro[0] ?? null;
                if ($row) {
                    $row['id'] = (int) $row['id'];
                    $row['estimatedTatDays'] = (int) $row['estimatedTatDays'];
                }
                api_json($row ?? ['id' => $id, 'status' => $status]);
            }

            if ($resource === 'warranty-claims' && $id !== null) {
                $input = api_input();
                $sets = [];
                $params = [':id' => $id];
                if (array_key_exists('status', $input)) {
                    $sets[] = 'status = :status';
                    $params[':status'] = $input['status'];
                }
                if (array_key_exists('response', $input)) {
                    $sets[] = 'response = :response';
                    $params[':response'] = $input['response'];
                }
                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }
                $sets[] = 'updated_at = NOW()';
                $pdo->prepare('UPDATE warranty_claims SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);

                $claim = api_query_all(
                    $pdo,
                    'SELECT id, user_id AS userId, product_id AS productId, record_id AS recordId, subject, description, status, response, created_at AS createdAt, updated_at AS updatedAt
                     FROM warranty_claims
                     WHERE id = :id
                     LIMIT 1',
                    ['id' => $id]
                );
                $row = $claim[0] ?? null;
                if ($row) {
                    $row['userId'] = (int) $row['userId'];
                    $row['productId'] = (int) $row['productId'];
                    $row['recordId'] = $row['recordId'] !== null ? (int) $row['recordId'] : null;
                }
                api_json($row ?? ['id' => $id]);
            }

            if ($resource === 'categories' && $id !== null) {
                $existing = api_query_all($pdo, 'SELECT id FROM categories WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($existing)) {
                    api_json(['error' => 'Category not found'], 404);
                }

                $input = api_input();
                $sets = [];
                $params = [':id' => $id];

                if (array_key_exists('name', $input)) {
                    $name = trim((string) $input['name']);
                    if ($name === '') {
                        api_json(['error' => 'Name cannot be empty'], 400);
                    }
                    $sets[] = 'name = :name';
                    $params[':name'] = $name;
                }
                if (array_key_exists('slug', $input)) {
                    $slug = trim((string) $input['slug']);
                    if ($slug === '') {
                        api_json(['error' => 'Slug cannot be empty'], 400);
                    }
                    $sets[] = 'slug = :slug';
                    $params[':slug'] = $slug;
                }
                if (array_key_exists('description', $input)) {
                    $sets[] = 'description = :description';
                    $params[':description'] = $input['description'];
                }
                if (array_key_exists('isActive', $input)) {
                    $sets[] = 'is_active = :isActive';
                    $params[':isActive'] = (int) ((bool) $input['isActive']);
                }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }

                if (array_key_exists(':name', $params) || array_key_exists(':slug', $params)) {
                    $duplicateConditions = [];
                    $duplicateParams = ['id' => $id];

                    if (array_key_exists(':name', $params)) {
                        $duplicateConditions[] = 'name = :checkName';
                        $duplicateParams['checkName'] = $params[':name'];
                    }
                    if (array_key_exists(':slug', $params)) {
                        $duplicateConditions[] = 'slug = :checkSlug';
                        $duplicateParams['checkSlug'] = $params[':slug'];
                    }

                    if (!empty($duplicateConditions)) {
                        $duplicateSql = 'SELECT id FROM categories WHERE id != :id AND (' . implode(' OR ', $duplicateConditions) . ') LIMIT 1';
                        $duplicate = api_query_all($pdo, $duplicateSql, $duplicateParams);
                        if (!empty($duplicate)) {
                            api_json(['error' => 'Category with this name or slug already exists'], 400);
                        }
                    }
                }

                $sets[] = 'updated_at = NOW()';
                $pdo->prepare('UPDATE categories SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);

                $updated = api_query_all(
                    $pdo,
                    'SELECT c.id, c.name, c.slug, c.description, c.product_count AS productCount, c.is_active AS isActive, c.created_at AS createdAt, c.updated_at AS updatedAt, COUNT(p.id) AS productCountLive
                     FROM categories c
                     LEFT JOIN products p ON p.category_id = c.id
                     WHERE c.id = :id
                     GROUP BY c.id
                     LIMIT 1',
                    ['id' => $id]
                );
                $row = $updated[0] ?? null;
                if ($row) {
                    $row['isActive'] = (bool) $row['isActive'];
                    $row['productCount'] = (int) ($row['productCountLive'] ?? $row['productCount'] ?? 0);
                    unset($row['productCountLive']);
                }
                api_json($row);
            }

            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'update',
                'id' => $id,
                'received' => api_input(),
                'message' => 'No admin UPDATE handler matched this resource.',
            ], 404);

        case 'DELETE':
            if ($resource === 'reviews' && $id !== null) {
                $pdo->prepare('DELETE FROM reviews WHERE id = :id')->execute([':id' => $id]);
                api_json(['success' => true]);
            }

            if ($resource === 'inventory' && $id !== null) {
                $existing = api_query_all($pdo, 'SELECT category_id AS categoryId FROM products WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($existing)) {
                    api_json(['error' => 'not_found'], 404);
                }
                $categoryId = $existing[0]['categoryId'] !== null ? (int) $existing[0]['categoryId'] : null;

                $pdo->beginTransaction();
                try {
                    $pdo->prepare('DELETE FROM cart WHERE product_id = :id')->execute([':id' => $id]);
                    $pdo->prepare('DELETE FROM notifications WHERE product_id = :id')->execute([':id' => $id]);
                    $pdo->prepare('DELETE FROM complaints WHERE product_id = :id')->execute([':id' => $id]);
                    $pdo->prepare('DELETE FROM warranty_records WHERE product_id = :id')->execute([':id' => $id]);
                    $pdo->prepare('DELETE FROM products WHERE id = :id')->execute([':id' => $id]);

                    if ($categoryId !== null) {
                        $countRow = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $categoryId]);
                        $pdo->prepare('UPDATE categories SET product_count = :count, updated_at = NOW() WHERE id = :id')->execute([':count' => (int) ($countRow[0]['total'] ?? 0), ':id' => $categoryId]);
                    }

                    $pdo->commit();
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }

                api_json(['success' => true]);
            }

            if ($resource === 'categories' && $id !== null) {
                $category = api_query_all($pdo, 'SELECT id FROM categories WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($category)) {
                    api_json(['error' => 'Category not found'], 404);
                }
                $countRow = api_query_all($pdo, 'SELECT COUNT(*) AS total FROM products WHERE category_id = :id', ['id' => $id]);
                if ((int) ($countRow[0]['total'] ?? 0) > 0) {
                    api_json(['error' => 'Cannot delete category with associated products. Reassign products first.'], 400);
                }

                $pdo->prepare('DELETE FROM categories WHERE id = :id')->execute([':id' => $id]);
                api_json(['message' => 'Category deleted successfully']);
            }

            if ($resource === 'orders' && $id !== null) {
                $pdo->beginTransaction();
                try {
                    $pdo->prepare('DELETE FROM order_items WHERE order_id = :id')->execute([':id' => $id]);
                    $pdo->prepare('DELETE FROM orders WHERE id = :id')->execute([':id' => $id]);
                    $pdo->commit();
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
                api_json(['message' => 'Order deleted successfully']);
            }

            if ($resource === 'warranty-claims' && $id !== null) {
                $pdo->prepare('DELETE FROM warranty_claims WHERE id = :id')->execute([':id' => $id]);
                api_json(['message' => 'Warranty claim deleted successfully']);
            }

            api_json([
                'resource' => $resource,
                'scope' => 'admin',
                'action' => 'delete',
                'id' => $id,
                'message' => 'No admin DELETE handler matched this resource.',
            ], 404);

        default:
            api_method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    }
}
