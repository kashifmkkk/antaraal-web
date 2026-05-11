<?php

function api_resource_route(PDO $pdo, string $resource, array $segments = []): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $id = isset($segments[0]) && ctype_digit((string) $segments[0]) ? (int) $segments[0] : null;

    if ($method === 'GET') {
        switch ($resource) {
            case 'products':
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT p.id, p.name, p.category, p.category_id AS categoryId, p.image, p.photos, p.description, p.reference_code AS referenceCode, p.vendor, p.price, p.availability, p.warranty, p.warranty_status AS warrantyStatus, p.rating, p.review_count AS reviewCount, p.status, p.warranty_expiry AS warrantyExpiry, p.created_at AS createdAt, p.updated_at AS updatedAt, c.slug AS categorySlug
                         FROM products p
                         LEFT JOIN categories c ON c.id = p.category_id
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
                    $row['warrantyExpiry'] = $row['warrantyExpiry'] ?? null;
                    api_json($row);
                }

                $products = api_query_all(
                    $pdo,
                    'SELECT p.id, p.name, COALESCE(NULLIF(p.category, \'\'), c.name) AS category, p.category_id AS categoryId, p.image, p.photos, p.description, p.reference_code AS referenceCode, p.vendor, p.price, p.availability, p.warranty, p.warranty_status AS warrantyStatus, p.rating, p.review_count AS reviewCount, p.status, p.warranty_expiry AS warrantyExpiry, p.created_at AS createdAt, p.updated_at AS updatedAt
                     FROM products p
                     LEFT JOIN categories c ON c.id = p.category_id
                     ORDER BY p.updated_at DESC, p.id DESC'
                );

                foreach ($products as &$product) {
                    $product['categoryId'] = $product['categoryId'] !== null ? (int) $product['categoryId'] : null;
                    $product['photos'] = api_json_decode_array($product['photos'] ?? null);
                    $product['rating'] = $product['rating'] !== null ? (float) $product['rating'] : null;
                    $product['reviewCount'] = (int) ($product['reviewCount'] ?? 0);
                    $product['warrantyExpiry'] = $product['warrantyExpiry'] ?? null;
                }

                api_json($products);

            case 'categories':
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive, c.created_at AS createdAt, c.updated_at AS updatedAt, COUNT(p.id) AS productCount
                         FROM categories c
                         LEFT JOIN products p ON p.category_id = c.id
                         WHERE c.id = :id
                         GROUP BY c.id
                         LIMIT 1',
                        ['id' => $id]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    $row['isActive'] = (bool) $row['isActive'];
                    $row['productCount'] = (int) $row['productCount'];
                    api_json($row);
                }

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

            case 'vendors':
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT id, name, location, rating, specialty, image, verification_status AS verificationStatus, is_active AS isActive, certifications, created_at AS createdAt, updated_at AS updatedAt
                         FROM vendors
                         WHERE id = :id
                         LIMIT 1',
                        ['id' => $id]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    $row['rating'] = $row['rating'] !== null ? (float) $row['rating'] : null;
                    $row['isActive'] = (bool) $row['isActive'];
                    $row['certifications'] = api_json_decode_array($row['certifications'] ?? null);
                    api_json($row);
                }

                $vendors = api_query_all(
                    $pdo,
                    'SELECT id, name, location, rating, specialty, image, verification_status AS verificationStatus, is_active AS isActive, certifications, created_at AS createdAt, updated_at AS updatedAt
                     FROM vendors
                     ORDER BY name ASC'
                );

                foreach ($vendors as &$vendor) {
                    $vendor['rating'] = $vendor['rating'] !== null ? (float) $vendor['rating'] : null;
                    $vendor['isActive'] = (bool) $vendor['isActive'];
                    $vendor['certifications'] = api_json_decode_array($vendor['certifications'] ?? null);
                }

                api_json($vendors);

            case 'notifications':
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json([]);
                }

                $params = ['userId' => (int) $user['id']];
                $vendorId = $user['vendor_id'] !== null ? (int) $user['vendor_id'] : null;
                $where = '(n.user_id = :userId';
                if ($vendorId !== null) {
                    $where .= ' OR n.vendor_id = :vendorId';
                    $params['vendorId'] = $vendorId;
                }
                $where .= ')';

                $since = trim((string) ($_GET['since'] ?? ''));
                if ($since !== '') {
                    $where .= ' AND n.created_at > :since';
                    $params['since'] = $since;
                }

                $notifications = api_query_all(
                    $pdo,
                    'SELECT n.id, n.title, n.body, n.user_id AS userId, n.vendor_id AS vendorId, n.product_id AS productId, n.is_read AS isRead, n.created_at AS createdAt,
                            u.name AS userName, u.email AS userEmail, v.name AS vendorName, v.location AS vendorLocation, p.name AS productName
                     FROM notifications n
                     LEFT JOIN users u ON u.id = n.user_id
                     LEFT JOIN vendors v ON v.id = n.vendor_id
                     LEFT JOIN products p ON p.id = n.product_id
                     WHERE ' . $where . '
                     ORDER BY n.created_at DESC
                     LIMIT 50',
                    $params
                );

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
                $currentUser = api_current_user($pdo);
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT r.id, r.product_id AS productId, r.user_id AS userId, r.user_name AS userName, r.rating, r.comment, r.status, r.created_at AS createdAt, r.updated_at AS updatedAt
                         FROM reviews r
                         WHERE r.id = :id
                         LIMIT 1',
                        ['id' => $id]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    if (
                        $row['status'] !== 'Approved'
                        && (!$currentUser || ((int) $row['userId'] !== (int) $currentUser['id'] && $currentUser['role'] !== 'ADMIN'))
                    ) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    $row['productId'] = (int) $row['productId'];
                    $row['userId'] = $row['userId'] !== null ? (int) $row['userId'] : null;
                    $row['rating'] = (int) $row['rating'];
                    api_json($row);
                }

                $productId = isset($segments[0]) && strtolower((string) $segments[0]) === 'product' && isset($segments[1]) && ctype_digit((string) $segments[1])
                    ? (int) $segments[1]
                    : null;

                $sql = 'SELECT r.id, r.product_id AS productId, r.user_id AS userId, r.user_name AS userName, r.rating, r.comment, r.status, r.created_at AS createdAt, r.updated_at AS updatedAt
                        FROM reviews r';
                $params = [];
                $conditions = [];

                if ($currentUser && isset($currentUser['id'])) {
                    $conditions[] = '(r.status = :approvedStatus OR r.user_id = :currentUserId)';
                    $params['approvedStatus'] = 'Approved';
                    $params['currentUserId'] = (int) $currentUser['id'];
                } else {
                    $conditions[] = 'r.status = :approvedStatus';
                    $params['approvedStatus'] = 'Approved';
                }

                if ($productId !== null) {
                    $conditions[] = 'r.product_id = :productId';
                    $params['productId'] = $productId;
                }

                if (!empty($conditions)) {
                    $sql .= ' WHERE ' . implode(' AND ', $conditions);
                }

                $sql .= ' ORDER BY r.created_at DESC, r.id DESC';

                $reviews = api_query_all($pdo, $sql, $params);
                foreach ($reviews as &$review) {
                    $review['productId'] = (int) $review['productId'];
                    $review['userId'] = $review['userId'] !== null ? (int) $review['userId'] : null;
                    $review['rating'] = (int) $review['rating'];
                }

                api_json($reviews);

            case 'orders':
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json([], 401);
                }

                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT o.id, o.user_id AS userId, o.order_number AS orderNumber, o.total_amount AS totalAmount, o.currency, o.status, o.payment_status AS paymentStatus, o.shipping_address AS shippingAddress, o.billing_address AS billingAddress, o.payment_method AS paymentMethod, o.tracking_number AS trackingNumber, o.shipping_carrier AS shippingCarrier, o.shipped_at AS shippedAt, o.delivered_at AS deliveredAt, o.created_at AS createdAt, o.updated_at AS updatedAt
                         FROM orders o
                         WHERE o.id = :id AND o.user_id = :userId
                         LIMIT 1',
                        ['id' => $id, 'userId' => (int) $user['id']]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }

                    // Get order items
                    $items = api_query_all(
                        $pdo,
                        'SELECT oi.id, oi.order_id AS orderId, oi.product_id AS productId, oi.quantity, oi.price, oi.created_at AS createdAt
                         FROM order_items oi
                         WHERE oi.order_id = :orderId',
                        ['orderId' => $id]
                    );

                    foreach ($items as &$item) {
                        $item['orderId'] = (int) $item['orderId'];
                        $item['productId'] = (int) $item['productId'];
                        $item['quantity'] = (int) $item['quantity'];
                        $item['price'] = (float) $item['price'];
                    }

                    $row['userId'] = (int) $row['userId'];
                    $row['totalAmount'] = (float) $row['totalAmount'];
                    $row['items'] = $items;
                    api_json($row);
                }

                $orders = api_query_all(
                    $pdo,
                    'SELECT o.id, o.user_id AS userId, o.order_number AS orderNumber, o.total_amount AS totalAmount, o.currency, o.status, o.payment_status AS paymentStatus, o.shipping_address AS shippingAddress, o.billing_address AS billingAddress, o.payment_method AS paymentMethod, o.tracking_number AS trackingNumber, o.shipping_carrier AS shippingCarrier, o.shipped_at AS shippedAt, o.delivered_at AS deliveredAt, o.created_at AS createdAt, o.updated_at AS updatedAt
                     FROM orders o
                     WHERE o.user_id = :userId
                     ORDER BY o.created_at DESC',
                    ['userId' => (int) $user['id']]
                );

                foreach ($orders as &$order) {
                    $order['userId'] = (int) $order['userId'];
                    $order['totalAmount'] = (float) $order['totalAmount'];
                    // Get items for each order
                    $items = api_query_all(
                        $pdo,
                        'SELECT oi.id, oi.order_id AS orderId, oi.product_id AS productId, oi.quantity, oi.price
                         FROM order_items oi
                         WHERE oi.order_id = :orderId',
                        ['orderId' => $order['id']]
                    );
                    foreach ($items as &$item) {
                        $item['orderId'] = (int) $item['orderId'];
                        $item['productId'] = (int) $item['productId'];
                        $item['quantity'] = (int) $item['quantity'];
                        $item['price'] = (float) $item['price'];
                    }
                    $order['items'] = $items;
                }

                api_json($orders);

            case 'warranty-claims':
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json([], 401);
                }

                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT wc.id, wc.user_id AS userId, wc.product_id AS productId, wc.record_id AS recordId, wc.subject, wc.description, wc.status, wc.response, wc.created_at AS createdAt, wc.updated_at AS updatedAt, p.name AS productName
                         FROM warranty_claims wc
                         LEFT JOIN products p ON p.id = wc.product_id
                         WHERE wc.id = :id AND wc.user_id = :userId
                         LIMIT 1',
                        ['id' => $id, 'userId' => (int) $user['id']]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }

                    $row['userId'] = (int) $row['userId'];
                    $row['productId'] = (int) $row['productId'];
                    $row['recordId'] = $row['recordId'] !== null ? (int) $row['recordId'] : null;
                    api_json($row);
                }

                $claims = api_query_all(
                    $pdo,
                    'SELECT wc.id, wc.user_id AS userId, wc.product_id AS productId, wc.record_id AS recordId, wc.subject, wc.description, wc.status, wc.response, wc.created_at AS createdAt, wc.updated_at AS updatedAt, p.name AS productName
                     FROM warranty_claims wc
                     LEFT JOIN products p ON p.id = wc.product_id
                     WHERE wc.user_id = :userId
                     ORDER BY wc.created_at DESC',
                    ['userId' => (int) $user['id']]
                );

                foreach ($claims as &$claim) {
                    $claim['userId'] = (int) $claim['userId'];
                    $claim['productId'] = (int) $claim['productId'];
                    $claim['recordId'] = $claim['recordId'] !== null ? (int) $claim['recordId'] : null;
                }

                api_json($claims);

            case 'warranties':
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json([], 401);
                }

                // Get warranty records for products user has purchased
                // This matches /api/warranties/my pattern
                $isMyRoute = !empty($segments) && $segments[0] === 'my';

                if ($isMyRoute) {
                    $warranties = api_query_all(
                        $pdo,
                        'SELECT DISTINCT wr.id, wr.product_id AS productId, wr.vendor_id AS vendorId, wr.tail_number AS tailNumber, wr.expiry_date AS expiryDate, wr.status, wr.created_at AS createdAt, p.name AS productName, v.name AS vendorName
                         FROM warranty_records wr
                         LEFT JOIN products p ON p.id = wr.product_id
                         LEFT JOIN vendors v ON v.id = wr.vendor_id
                         LEFT JOIN order_items oi ON oi.product_id = p.id
                         LEFT JOIN orders o ON o.id = oi.order_id
                         WHERE o.user_id = :userId
                         ORDER BY wr.expiry_date DESC',
                        ['userId' => (int) $user['id']]
                    );

                    foreach ($warranties as &$warranty) {
                        $warranty['productId'] = (int) $warranty['productId'];
                        $warranty['vendorId'] = $warranty['vendorId'] !== null ? (int) $warranty['vendorId'] : null;
                    }

                    api_json($warranties);
                }

                // Single warranty record by ID
                if ($id !== null) {
                    $rows = api_query_all(
                        $pdo,
                        'SELECT wr.id, wr.product_id AS productId, wr.vendor_id AS vendorId, wr.tail_number AS tailNumber, wr.expiry_date AS expiryDate, wr.status, wr.created_at AS createdAt, p.name AS productName, v.name AS vendorName
                         FROM warranty_records wr
                         LEFT JOIN products p ON p.id = wr.product_id
                         LEFT JOIN vendors v ON v.id = wr.vendor_id
                         LEFT JOIN order_items oi ON oi.product_id = p.id
                         LEFT JOIN orders o ON o.id = oi.order_id
                         WHERE wr.id = :id AND o.user_id = :userId
                         LIMIT 1',
                        ['id' => $id, 'userId' => (int) $user['id']]
                    );
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }

                    $row['productId'] = (int) $row['productId'];
                    $row['vendorId'] = $row['vendorId'] !== null ? (int) $row['vendorId'] : null;
                    api_json($row);
                }

                // Default: return all warranties for user's products
                $warranties = api_query_all(
                    $pdo,
                    'SELECT DISTINCT wr.id, wr.product_id AS productId, wr.vendor_id AS vendorId, wr.tail_number AS tailNumber, wr.expiry_date AS expiryDate, wr.status, wr.created_at AS createdAt, p.name AS productName, v.name AS vendorName
                     FROM warranty_records wr
                     LEFT JOIN products p ON p.id = wr.product_id
                     LEFT JOIN vendors v ON v.id = wr.vendor_id
                     LEFT JOIN order_items oi ON oi.product_id = p.id
                     LEFT JOIN orders o ON o.id = oi.order_id
                     WHERE o.user_id = :userId
                     ORDER BY wr.expiry_date DESC',
                    ['userId' => (int) $user['id']]
                );

                foreach ($warranties as &$warranty) {
                    $warranty['productId'] = (int) $warranty['productId'];
                    $warranty['vendorId'] = $warranty['vendorId'] !== null ? (int) $warranty['vendorId'] : null;
                }

                api_json($warranties);

            case 'cart':
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json([], 401);
                }

                $items = api_query_all(
                    $pdo,
                    'SELECT c.id, c.user_id AS userId, c.product_id AS productId, c.quantity, c.created_at AS createdAt, c.updated_at AS updatedAt, p.name AS productName, p.image, p.price, p.availability
                     FROM cart c
                     LEFT JOIN products p ON p.id = c.product_id
                     WHERE c.user_id = :userId
                     ORDER BY c.created_at DESC',
                    ['userId' => (int) $user['id']]
                );

                foreach ($items as &$item) {
                    $productId = (int) $item['productId'];
                    $price = $item['price'] !== null ? (string) $item['price'] : '0';
                    $item = [
                        'id' => (int) $item['id'],
                        'productId' => $productId,
                        'quantity' => (int) $item['quantity'],
                        'createdAt' => $item['createdAt'],
                        'updatedAt' => $item['updatedAt'],
                        'product' => [
                            'id' => $productId,
                            'name' => $item['productName'] ?? 'Unknown Product',
                            'price' => $price,
                            'image' => $item['image'] ?? '/placeholder.svg',
                            'availability' => $item['availability'] ?? 'On Request',
                        ],
                    ];
                }

                api_json($items);

            case 'pricing-ranges':
                // DB-backed pricing ranges. Table: pricing_ranges (id, role, label, min_value, max_value, description, created_at, updated_at)
                $roleParam = strtolower(trim((string) ($_GET['role'] ?? '')));
                $params = [];
                $where = '';
                if ($roleParam === 'buyer') {
                    $where = ' WHERE role = :role';
                    $params['role'] = 'BUYER';
                } elseif ($roleParam === 'vendor' || $roleParam === 'seller') {
                    $where = ' WHERE role = :role';
                    $params['role'] = 'VENDOR';
                }

                $rows = api_query_all($pdo, 'SELECT id, role, label, min_value AS min, max_value AS max, description, created_at AS createdAt, updated_at AS updatedAt FROM pricing_ranges' . $where . ' ORDER BY id ASC', $params);

                $buyers = [];
                $sellers = [];
                foreach ($rows as $r) {
                    $item = [
                        'id' => (int) $r['id'],
                        'label' => $r['label'],
                        'min' => $r['min'],
                        'max' => $r['max'],
                        'description' => $r['description'] ?? null,
                        'createdAt' => $r['createdAt'] ?? null,
                        'updatedAt' => $r['updatedAt'] ?? null,
                    ];
                    if (strtoupper((string) $r['role']) === 'BUYER') {
                        $buyers[] = $item;
                    } else {
                        $sellers[] = $item;
                    }
                }

                if ($roleParam === 'buyer') {
                    api_json($buyers);
                }
                if ($roleParam === 'vendor' || $roleParam === 'seller') {
                    api_json($sellers);
                }

                api_json(['buyers' => $buyers, 'sellers' => $sellers]);

            case 'rfqs':
                $sql = 'SELECT id, user_id AS userId, product_id AS productId, quantity, budget, specification, status, created_at AS createdAt, updated_at AS updatedAt
                        FROM rfqs';
                $params = [];

                if ($id !== null) {
                    $sql = 'SELECT id, user_id AS userId, product_id AS productId, quantity, budget, specification, status, created_at AS createdAt, updated_at AS updatedAt
                            FROM rfqs WHERE id = :id LIMIT 1';
                    $params = ['id' => $id];

                    $rows = api_query_all($pdo, $sql, $params);
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    $row['userId'] = (int) $row['userId'];
                    $row['productId'] = (int) $row['productId'];
                    $row['quantity'] = (int) $row['quantity'];
                    $row['budget'] = (float) ($row['budget'] ?? 0);
                    api_json($row);
                }

                $rfqs = api_query_all($pdo, $sql . ' ORDER BY created_at DESC', $params);
                foreach ($rfqs as &$rfq) {
                    $rfq['userId'] = (int) $rfq['userId'];
                    $rfq['productId'] = (int) $rfq['productId'];
                    $rfq['quantity'] = (int) $rfq['quantity'];
                    $rfq['budget'] = (float) ($rfq['budget'] ?? 0);
                }
                api_json($rfqs);

                case 'quotes':
                $sql = 'SELECT id, rfq_id AS rfqId, vendor_id AS vendorId, user_id AS userId, amount, comments, valid_until AS validUntil, status, created_at AS createdAt
                    FROM quotes';
                $params = [];

                if (($segments[0] ?? '') === 'my') {
                    $currentUser = api_current_user($pdo);
                    if (!$currentUser) {
                        api_json(['error' => 'unauthorized'], 401);
                    }

                    if ($currentUser['role'] !== 'ADMIN') {
                        if ($currentUser['role'] === 'VENDOR' && !empty($currentUser['vendor_id'])) {
                            $sql .= ' WHERE vendor_id = :currentVendorId';
                            $params['currentVendorId'] = (int) $currentUser['vendor_id'];
                        } else {
                            $sql .= ' WHERE user_id = :currentUserId';
                            $params['currentUserId'] = (int) $currentUser['id'];
                        }
                    }

                    $quotes = api_query_all($pdo, $sql . ' ORDER BY created_at DESC', $params);
                    foreach ($quotes as &$quote) {
                        $quote['id'] = (int) $quote['id'];
                        $quote['rfqId'] = $quote['rfqId'] !== null ? (int) $quote['rfqId'] : null;
                        $quote['vendorId'] = $quote['vendorId'] !== null ? (int) $quote['vendorId'] : null;
                        $quote['userId'] = $quote['userId'] !== null ? (int) $quote['userId'] : null;
                        $quote['amount'] = (float) $quote['amount'];
                        $quote['validUntil'] = $quote['validUntil'] ?? null;
                    }
                    api_json($quotes);
                }

                if ($id !== null) {
                    $sql = 'SELECT id, rfq_id AS rfqId, vendor_id AS vendorId, user_id AS userId, amount, comments, valid_until AS validUntil, status, created_at AS createdAt
                            FROM quotes WHERE id = :id LIMIT 1';
                    $params = ['id' => $id];

                    $rows = api_query_all($pdo, $sql, $params);
                    $row = $rows[0] ?? null;
                    if (!$row) {
                        api_json(['error' => 'not_found'], 404);
                    }
                    $row['rfqId'] = $row['rfqId'] !== null ? (int) $row['rfqId'] : null;
                    $row['vendorId'] = $row['vendorId'] !== null ? (int) $row['vendorId'] : null;
                    $row['userId'] = $row['userId'] !== null ? (int) $row['userId'] : null;
                    $row['amount'] = (float) $row['amount'];
                    $row['validUntil'] = $row['validUntil'] ?? null;
                    api_json($row);
                }

                $quotes = api_query_all($pdo, $sql . ' ORDER BY created_at DESC', $params);
                foreach ($quotes as &$quote) {
                    $quote['id'] = (int) $quote['id'];
                    $quote['rfqId'] = $quote['rfqId'] !== null ? (int) $quote['rfqId'] : null;
                    $quote['vendorId'] = $quote['vendorId'] !== null ? (int) $quote['vendorId'] : null;
                    $quote['userId'] = $quote['userId'] !== null ? (int) $quote['userId'] : null;
                    $quote['amount'] = (float) $quote['amount'];
                    $quote['validUntil'] = $quote['validUntil'] ?? null;
                }
                api_json($quotes);
        }
    }

    switch ($method) {
        case 'GET':
            api_json([
                'resource' => $resource,
                'action' => $id ? 'show' : 'index',
                'id' => $id,
                'message' => 'Replace this stub with a real SELECT query.',
            ]);

        case 'POST':
            if ($resource === 'categories') {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can create categories.'], 403);
                }

                $input = api_input();
                $name = trim($input['name'] ?? '');
                $slug = trim($input['slug'] ?? api_slugify($name));
                $description = trim($input['description'] ?? '');
                $isActive = filter_var($input['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN);

                if (empty($name) || empty($slug)) {
                    api_json(['error' => 'validation_error', 'message' => 'Name and slug are required.'], 400);
                }

                // Check for duplicate slug
                $slugCheck = api_query_all($pdo, 'SELECT id FROM categories WHERE slug = :slug LIMIT 1', ['slug' => $slug]);
                if ($slugCheck) {
                    api_json(['error' => 'conflict', 'message' => 'A category with this slug already exists.'], 409);
                }

                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
                         VALUES (:name, :slug, :description, :isActive, NOW(), NOW())'
                    );
                    $stmt->execute([
                        ':name' => $name,
                        ':slug' => $slug,
                        ':description' => $description,
                        ':isActive' => (int) $isActive,
                    ]);

                    $categoryId = (int) $pdo->lastInsertId();

                    $newCategory = [
                        'id' => $categoryId,
                        'name' => $name,
                        'slug' => $slug,
                        'description' => $description,
                        'isActive' => $isActive,
                        'productCount' => 0,
                    ];

                    api_json($newCategory, 201);
                } catch (Exception $e) {
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to create category: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'pricing-ranges') {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can create pricing ranges.'], 403);
                }

                $input = api_input();
                $role = strtoupper(trim((string) ($input['role'] ?? '')));
                $label = trim((string) ($input['label'] ?? ''));
                $min = trim((string) ($input['min'] ?? ''));
                $max = trim((string) ($input['max'] ?? ''));
                $description = isset($input['description']) ? trim((string) $input['description']) : null;

                if (!in_array($role, ['BUYER', 'VENDOR'], true) || $label === '' || $min === '' || $max === '') {
                    api_json(['error' => 'validation_error', 'message' => 'role (BUYER|VENDOR), label, min and max are required'], 400);
                }

                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO pricing_ranges (role, label, min_value, max_value, description, created_at, updated_at)
                         VALUES (:role, :label, :min, :max, :description, NOW(), NOW())'
                    );
                    $stmt->execute([
                        ':role' => $role,
                        ':label' => $label,
                        ':min' => $min,
                        ':max' => $max,
                        ':description' => $description,
                    ]);
                    $newId = (int) $pdo->lastInsertId();
                    $new = api_query_all($pdo, 'SELECT id, role, label, min_value AS min, max_value AS max, description, created_at AS createdAt, updated_at AS updatedAt FROM pricing_ranges WHERE id = :id LIMIT 1', ['id' => $newId]);
                    api_json($new[0] ?? null, 201);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'quotes') {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'VENDOR' || !$user['vendor_id']) {
                    api_json(['error' => 'unauthorized', 'message' => 'Only vendors can submit quotes.'], 403);
                }

                $input = api_input();
                $rfqId = array_key_exists('rfqId', $input) ? filter_var($input['rfqId'], FILTER_VALIDATE_INT) : null;
                $amount = filter_var($input['amount'] ?? null, FILTER_VALIDATE_FLOAT);
                $validityDays = filter_var($input['validityDays'] ?? 30, FILTER_VALIDATE_INT);
                $comments = isset($input['comments']) ? trim((string) $input['comments']) : null;

                if ($amount === false || $amount <= 0) {
                    api_json(['error' => 'validation_error', 'message' => 'A valid amount is required.'], 400);
                }
                if ($rfqId === false) {
                    api_json(['error' => 'validation_error', 'message' => 'rfqId must be an integer if provided.'], 400);
                }
                if ($validityDays === false || $validityDays < 1) {
                    $validityDays = 30;
                }

                $rfq = null;
                if ($rfqId !== null) {
                    $rfqResult = api_query_all($pdo, 'SELECT id, buyer_id AS buyerId, assigned_vendor_id AS assignedVendorId, status FROM rfqs WHERE id = :id LIMIT 1', ['id' => $rfqId]);
                    $rfq = $rfqResult[0] ?? null;
                    if (!$rfq) {
                        api_json(['error' => 'not_found', 'message' => 'The specified RFQ does not exist.'], 404);
                    }
                    if (!in_array((string) $rfq['status'], ['New', 'Pending', 'Open', 'In Review'], true)) {
                        api_json(['error' => 'conflict', 'message' => 'This RFQ has already been quoted or is closed.'], 409);
                    }
                    if ($rfq['assignedVendorId'] !== null && (int) $rfq['assignedVendorId'] !== (int) $user['vendor_id']) {
                        api_json(['error' => 'forbidden', 'message' => 'This RFQ is assigned to a different vendor.'], 403);
                    }
                }

                try {
                    $pdo->beginTransaction();
                    $validUntil = date('Y-m-d H:i:s', strtotime('+' . (int) $validityDays . ' days'));
                    $buyerUserId = isset($rfq['buyerId']) && $rfq['buyerId'] !== null ? (int) $rfq['buyerId'] : null;

                    $quoteStmt = $pdo->prepare(
                        'INSERT INTO quotes (rfq_id, vendor_id, user_id, amount, currency, status, comments, issued_at, valid_until, created_at)
                         VALUES (:rfqId, :vendorId, :userId, :amount, :currency, :status, :comments, NOW(), :validUntil, NOW())'
                    );
                    $quoteStmt->execute([
                        ':rfqId' => $rfqId !== null ? $rfqId : null,
                        ':vendorId' => (int) $user['vendor_id'],
                        ':userId' => $buyerUserId,
                        ':amount' => $amount,
                        ':currency' => 'INR',
                        ':status' => 'Sent',
                        ':comments' => $comments,
                        ':validUntil' => $validUntil,
                    ]);
                    $quoteId = (int) $pdo->lastInsertId();

                    if ($rfqId !== null) {
                        $updateRfqStmt = $pdo->prepare('UPDATE rfqs SET status = :status WHERE id = :id');
                        $updateRfqStmt->execute([':status' => 'Quoted', ':id' => $rfqId]);
                    }

                    $pdo->commit();

                    $newQuoteResult = api_query_all(
                        $pdo,
                        'SELECT id, rfq_id AS rfqId, vendor_id AS vendorId, user_id AS userId, amount, currency, status, comments, issued_at AS issuedAt, valid_until AS validUntil, created_at AS createdAt
                         FROM quotes
                         WHERE id = :id
                         LIMIT 1',
                        ['id' => $quoteId]
                    );
                    $newQuote = $newQuoteResult[0] ?? null;
                    if ($newQuote) {
                        $newQuote['rfqId'] = $newQuote['rfqId'] !== null ? (int) $newQuote['rfqId'] : null;
                        $newQuote['vendorId'] = $newQuote['vendorId'] !== null ? (int) $newQuote['vendorId'] : null;
                        $newQuote['userId'] = $newQuote['userId'] !== null ? (int) $newQuote['userId'] : null;
                        $newQuote['amount'] = (float) $newQuote['amount'];
                    }

                    api_json($newQuote, 201);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to create quote: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'rfqs') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $productId = filter_var($input['productId'] ?? null, FILTER_VALIDATE_INT);
                $quantity = filter_var($input['quantity'] ?? null, FILTER_VALIDATE_INT);
                $specification = trim($input['specification'] ?? '');
                $budget = filter_var($input['budget'] ?? null, FILTER_VALIDATE_FLOAT);

                if ($productId === false || $quantity === false || $quantity < 1) {
                    api_json(['error' => 'validation_error', 'message' => 'A valid productId and quantity are required.'], 400);
                }

                // Check if product exists
                $productCheck = api_query_all($pdo, 'SELECT id FROM products WHERE id = :id LIMIT 1', ['id' => $productId]);
                if (empty($productCheck)) {
                    api_json(['error' => 'not_found', 'message' => 'The specified product does not exist.'], 404);
                }

                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO rfqs (user_id, product_id, quantity, specification, budget, status, created_at, updated_at)
                         VALUES (:userId, :productId, :quantity, :specification, :budget, :status, NOW(), NOW())'
                    );
                    $stmt->execute([
                        ':userId' => (int) $user['id'],
                        ':productId' => $productId,
                        ':quantity' => $quantity,
                        ':specification' => $specification,
                        ':budget' => $budget,
                        ':status' => 'Pending',
                    ]);

                    $rfqId = (int) $pdo->lastInsertId();

                    // Fetch and return the new RFQ
                    $newRfqResult = api_query_all($pdo, 'SELECT * FROM rfqs WHERE id = :id', ['id' => $rfqId]);
                    $newRfq = $newRfqResult[0] ?? null;
                    if ($newRfq) {
                        $newRfq['id'] = (int) $newRfq['id'];
                        $newRfq['user_id'] = (int) $newRfq['user_id'];
                        $newRfq['product_id'] = (int) $newRfq['product_id'];
                        $newRfq['quantity'] = (int) $newRfq['quantity'];
                        $newRfq['budget'] = $newRfq['budget'] !== null ? (float) $newRfq['budget'] : null;
                    }

                    api_json($newRfq, 201);
                } catch (Exception $e) {
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to create RFQ: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'reviews') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $productId = isset($input['productId']) ? (int) $input['productId'] : 0;
                $rating = isset($input['rating']) ? (int) $input['rating'] : 0;
                $comment = isset($input['comment']) ? trim((string) $input['comment']) : null;

                if ($productId <= 0 || $rating < 1 || $rating > 5) {
                    api_json(['error' => 'validation_error', 'message' => 'productId and rating (1-5) are required'], 400);
                }

                $product = api_query_all($pdo, 'SELECT id FROM products WHERE id = :id LIMIT 1', ['id' => $productId]);
                if (empty($product)) {
                    api_json(['error' => 'product_not_found'], 404);
                }

                $existing = api_query_all(
                    $pdo,
                    'SELECT id FROM reviews WHERE product_id = :productId AND user_id = :userId LIMIT 1',
                    ['productId' => $productId, 'userId' => (int) $user['id']]
                );
                if (!empty($existing)) {
                    api_json(['error' => 'already_reviewed'], 400);
                }

                $stmt = $pdo->prepare(
                    'INSERT INTO reviews (product_id, user_id, user_name, rating, comment, status, created_at, updated_at)
                     VALUES (:productId, :userId, :userName, :rating, :comment, :status, NOW(), NOW())'
                );
                $stmt->execute([
                    ':productId' => $productId,
                    ':userId' => (int) $user['id'],
                    ':userName' => $user['name'] ?? 'Anonymous',
                    ':rating' => $rating,
                    ':comment' => $comment,
                    ':status' => 'Pending',
                ]);

                $reviewId = (int) $pdo->lastInsertId();
                $row = api_query_all(
                    $pdo,
                    'SELECT id, product_id AS productId, user_id AS userId, user_name AS userName, rating, comment, status, created_at AS createdAt, updated_at AS updatedAt
                     FROM reviews WHERE id = :id LIMIT 1',
                    ['id' => $reviewId]
                );
                api_json($row[0] ?? ['id' => $reviewId], 201);
            }

            if ($resource === 'products') {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'VENDOR' || !$user['vendor_id']) {
                    api_json(['error' => 'unauthorized', 'message' => 'Only verified vendors can create products.'], 403);
                }

                $input = api_input();

                $name = trim($input['name'] ?? '');
                $category = trim((string) ($input['category'] ?? ''));
                $categoryId = isset($input['categoryId']) && $input['categoryId'] !== '' ? (int) $input['categoryId'] : null;
                $description = trim($input['description'] ?? '');
                $referenceCode = trim($input['referenceCode'] ?? '');
                $availability = trim((string) ($input['availability'] ?? 'On Request'));
                $image = trim((string) ($input['image'] ?? '/placeholder.svg'));
                $price = isset($input['price']) ? (string) $input['price'] : null;
                $warranty = isset($input['warranty']) ? trim((string) $input['warranty']) : null;
                $photos = [];
                if (is_array($input['photos'] ?? null)) {
                    $photos = array_values(array_filter($input['photos']));
                }
                if (empty($photos) && $image !== '') {
                    $photos = [$image];
                }

                if ($name === '' || $category === '') {
                    api_json(['error' => 'validation_error', 'message' => 'name and category required'], 400);
                }

                if ($categoryId !== null) {
                    $categoryRows = api_query_all($pdo, 'SELECT id, name FROM categories WHERE id = :id LIMIT 1', ['id' => $categoryId]);
                    $cat = $categoryRows[0] ?? null;
                    if (!$cat) {
                        api_json(['error' => 'not_found', 'message' => 'The specified category does not exist.'], 404);
                    }
                    $category = (string) ($cat['name'] ?? $category);
                }

                $vendorRows = api_query_all($pdo, 'SELECT id, name FROM vendors WHERE id = :id LIMIT 1', ['id' => (int) $user['vendor_id']]);
                $vendor = $vendorRows[0] ?? null;
                if (!$vendor) {
                    api_json(['error' => 'forbidden', 'message' => 'vendor profile missing'], 403);
                }

                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO products (name, category, category_id, image, photos, description, reference_code, vendor, price, availability, warranty, warranty_status, status, created_at, updated_at)
                         VALUES (:name, :category, :categoryId, :image, :photos, :description, :referenceCode, :vendor, :price, :availability, :warranty, :warrantyStatus, :status, NOW(), NOW())'
                    );
                    $stmt->execute([
                        ':name' => $name,
                        ':category' => $category,
                        ':categoryId' => $categoryId,
                        ':image' => $image !== '' ? $image : '/placeholder.svg',
                        ':photos' => json_encode($photos),
                        ':vendor' => (string) $vendor['name'],
                        ':price' => $price,
                        ':description' => $description,
                        ':referenceCode' => $referenceCode,
                        ':availability' => $availability,
                        ':warranty' => $warranty,
                        ':warrantyStatus' => 'Active',
                        ':status' => 'pending',
                    ]);

                    $productId = (int) $pdo->lastInsertId();

                    $newProductResult = api_query_all($pdo, 'SELECT * FROM products WHERE id = :id', ['id' => $productId]);
                    $newProduct = $newProductResult[0] ?? null;
                    if ($newProduct) {
                        $newProduct['id'] = (int) $newProduct['id'];
                        $newProduct['category_id'] = $newProduct['category_id'] !== null ? (int) $newProduct['category_id'] : null;
                        $newProduct['photos'] = api_json_decode_array($newProduct['photos'] ?? null);
                    }

                    api_json($newProduct, 201);
                } catch (Exception $e) {
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to create product: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'vendors' && isset($segments[0]) && $segments[0] === 'register') {
                $input = api_input();

                // User data
                $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
                $password = $input['password'] ?? '';
                $name = trim($input['name'] ?? ''); // User's contact name

                // Vendor data
                $vendorName = trim($input['vendorName'] ?? '');
                $vendorLocation = trim($input['vendorLocation'] ?? '');
                $vendorSpecialty = trim($input['vendorSpecialty'] ?? '');

                if (!$email || empty($password) || empty($name) || empty($vendorName) || empty($vendorLocation)) {
                    api_json(['error' => 'validation_error', 'message' => 'Missing required fields.'], 400);
                }

                // Check for existing user or vendor
                $userExists = api_query_all($pdo, 'SELECT id FROM users WHERE email = :email LIMIT 1', ['email' => $email]);
                if ($userExists) {
                    api_json(['error' => 'user_exists', 'message' => 'A user with this email already exists.'], 409);
                }
                $vendorExists = api_query_all($pdo, 'SELECT id FROM vendors WHERE name = :name LIMIT 1', ['name' => $vendorName]);
                if ($vendorExists) {
                    api_json(['error' => 'vendor_exists', 'message' => 'A vendor with this name already exists.'], 409);
                }

                try {
                    $pdo->beginTransaction();

                    // 1. Create Vendor
                    $vendorStmt = $pdo->prepare(
                        'INSERT INTO vendors (name, location, specialty, verification_status, is_active, created_at, updated_at)
                         VALUES (:name, :location, :specialty, :status, :isActive, NOW(), NOW())'
                    );
                    $vendorStmt->execute([
                        ':name' => $vendorName,
                        ':location' => $vendorLocation,
                        ':specialty' => $vendorSpecialty,
                        ':status' => 'Pending',
                        ':isActive' => false,
                    ]);
                    $vendorId = (int) $pdo->lastInsertId();

                    // 2. Create User
                    $userStmt = $pdo->prepare(
                        'INSERT INTO users (email, name, password_hash, role, vendor_id, created_at, updated_at)
                         VALUES (:email, :name, :passwordHash, :role, :vendorId, NOW(), NOW())'
                    );
                    $userStmt->execute([
                        ':email' => $email,
                        ':name' => $name,
                        ':passwordHash' => password_hash($password, PASSWORD_DEFAULT),
                        ':role' => 'VENDOR',
                        ':vendorId' => $vendorId,
                    ]);
                    $userId = (int) $pdo->lastInsertId();

                    $pdo->commit();

                    // Don't return password hash
                    api_json([
                        'user' => ['id' => $userId, 'email' => $email, 'name' => $name, 'role' => 'VENDOR'],
                        'vendor' => ['id' => $vendorId, 'name' => $vendorName, 'location' => $vendorLocation, 'specialty' => $vendorSpecialty],
                        'message' => 'Vendor registration successful. Awaiting admin approval.',
                    ], 201);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to register vendor: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'orders') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $shippingAddress = $input['shippingAddress'] ?? null;
                $billingAddress = $input['billingAddress'] ?? $shippingAddress; // Default to shipping
                $paymentMethod = $input['paymentMethod'] ?? 'Credit Card';

                if (!$shippingAddress) {
                    api_json(['error' => 'validation_error', 'message' => 'shippingAddress is required'], 400);
                }

                // Get all cart items for the user
                $cartItems = api_query_all(
                    $pdo,
                    'SELECT c.product_id, c.quantity, p.price
                     FROM cart c
                     JOIN products p ON c.product_id = p.id
                     WHERE c.user_id = :userId',
                    ['userId' => (int) $user['id']]
                );

                if (empty($cartItems)) {
                    api_json(['error' => 'cart_empty', 'message' => 'Cannot create an order with an empty cart.'], 400);
                }

                // Calculate total amount
                $totalAmount = 0;
                foreach ($cartItems as $item) {
                    $totalAmount += (float) $item['price'] * (int) $item['quantity'];
                }
                // You might add taxes, shipping costs etc. here
                // For simplicity, we'll just use the sum of item prices.

                try {
                    $pdo->beginTransaction();

                    // 1. Create the order
                    $orderStmt = $pdo->prepare(
                        'INSERT INTO orders (user_id, order_number, total_amount, currency, status, payment_status, shipping_address, billing_address, payment_method, created_at, updated_at)
                         VALUES (:userId, :orderNumber, :totalAmount, :currency, :status, :paymentStatus, :shippingAddress, :billingAddress, :paymentMethod, NOW(), NOW())'
                    );
                    $orderNumber = 'SKY-' . strtoupper(uniqid());
                    $orderStmt->execute([
                        ':userId' => (int) $user['id'],
                        ':orderNumber' => $orderNumber,
                        ':totalAmount' => $totalAmount,
                        ':currency' => 'USD', // Or your default currency
                        ':status' => 'Pending',
                        ':paymentStatus' => 'Paid', // Assuming payment is successful
                        ':shippingAddress' => json_encode($shippingAddress),
                        ':billingAddress' => json_encode($billingAddress),
                        ':paymentMethod' => $paymentMethod,
                    ]);
                    $orderId = (int) $pdo->lastInsertId();

                    // 2. Insert order items
                    $orderItemStmt = $pdo->prepare(
                        'INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
                         VALUES (:orderId, :productId, :quantity, :price, NOW())'
                    );
                    foreach ($cartItems as $item) {
                        $orderItemStmt->execute([
                            ':orderId' => $orderId,
                            ':productId' => (int) $item['product_id'],
                            ':quantity' => (int) $item['quantity'],
                            ':price' => (float) $item['price'],
                        ]);
                    }

                    // 3. Clear the user's cart
                    $clearCartStmt = $pdo->prepare('DELETE FROM cart WHERE user_id = :userId');
                    $clearCartStmt->execute([':userId' => (int) $user['id']]);

                    $pdo->commit();

                    // Fetch the newly created order to return it
                    $newOrderResult = api_query_all($pdo, 'SELECT * FROM orders WHERE id = :id', ['id' => $orderId]);
                    $newOrder = $newOrderResult[0] ?? null;
                    if ($newOrder) {
                        $newOrder['id'] = (int) $newOrder['id'];
                        $newOrder['user_id'] = (int) $newOrder['user_id'];
                        $newOrder['total_amount'] = (float) $newOrder['total_amount'];
                        $newOrder['shipping_address'] = json_decode($newOrder['shipping_address']);
                        $newOrder['billing_address'] = json_decode($newOrder['billing_address']);
                        $newOrder['items'] = $cartItems; // simplified
                    }

                    api_json($newOrder, 201);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json([
                        'error' => 'database_error',
                        'message' => 'Failed to create order: ' . $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'warranty-claims') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $productId = isset($input['productId']) ? (int) $input['productId'] : null;
                $subject = isset($input['subject']) ? trim((string) $input['subject']) : null;
                $description = isset($input['description']) ? trim((string) $input['description']) : null;

                if (!$productId || !$subject || !$description) {
                    api_json([
                        'error' => 'validation_error',
                        'message' => 'productId, subject, and description are required',
                    ], 400);
                }

                // Verify product exists
                $productCheck = api_query_all(
                    $pdo,
                    'SELECT id FROM products WHERE id = :productId LIMIT 1',
                    ['productId' => $productId]
                );

                if (empty($productCheck)) {
                    api_json(['error' => 'product_not_found'], 404);
                }

                // Insert warranty claim
                try {
                    $stmt = $pdo->prepare('INSERT INTO warranty_claims (user_id, product_id, subject, description, status, created_at, updated_at) VALUES (:userId, :productId, :subject, :description, :status, NOW(), NOW())');
                    $stmt->execute([
                        ':userId' => (int) $user['id'],
                        ':productId' => $productId,
                        ':subject' => $subject,
                        ':description' => $description,
                        ':status' => 'Pending',
                    ]);

                    $claimId = (int) $pdo->lastInsertId();

                    api_json([
                        'id' => $claimId,
                        'userId' => (int) $user['id'],
                        'productId' => $productId,
                        'subject' => $subject,
                        'description' => $description,
                        'status' => 'Pending',
                        'response' => null,
                        'recordId' => null,
                        'createdAt' => date('c'),
                        'updatedAt' => date('c'),
                    ], 201);
                } catch (Exception $e) {
                    api_json([
                        'error' => 'database_error',
                        'message' => $e->getMessage(),
                    ], 500);
                }
            }

            if ($resource === 'cart') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $productId = isset($input['productId']) ? (int) $input['productId'] : null;
                $quantity = isset($input['quantity']) ? (int) $input['quantity'] : 1;

                if (!$productId) {
                    api_json(['error' => 'validation_error', 'message' => 'productId is required'], 400);
                }

                // Check if item already exists
                $existing = api_query_all($pdo, 'SELECT id, quantity FROM cart WHERE user_id = :userId AND product_id = :productId LIMIT 1', ['userId' => (int) $user['id'], 'productId' => $productId]);

                try {
                    if (!empty($existing)) {
                        // Update quantity
                        $newQuantity = $existing[0]['quantity'] + $quantity;
                        $stmt = $pdo->prepare('UPDATE cart SET quantity = :quantity, updated_at = NOW() WHERE id = :id');
                        $stmt->execute([':quantity' => $newQuantity, ':id' => $existing[0]['id']]);
                        $cartId = (int) $existing[0]['id'];
                    } else {
                        // Insert new item
                        $stmt = $pdo->prepare('INSERT INTO cart (user_id, product_id, quantity, created_at, updated_at) VALUES (:userId, :productId, :quantity, NOW(), NOW())');
                        $stmt->execute([':userId' => (int) $user['id'], ':productId' => $productId, ':quantity' => $quantity]);
                        $cartId = (int) $pdo->lastInsertId();
                    }

                    // Fetch the created/updated item to return
                    $newItemResult = api_query_all($pdo, 'SELECT c.id, c.user_id AS userId, c.product_id AS productId, c.quantity, c.created_at AS createdAt, c.updated_at AS updatedAt, p.name AS productName, p.price, p.image, p.availability FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = :id', ['id' => $cartId]);
                    $newItem = $newItemResult[0] ?? null;
                    if ($newItem) {
                        $productIdOut = (int) $newItem['productId'];
                        $newItem = [
                            'id' => (int) $newItem['id'],
                            'productId' => $productIdOut,
                            'quantity' => (int) $newItem['quantity'],
                            'createdAt' => $newItem['createdAt'] ?? null,
                            'updatedAt' => $newItem['updatedAt'] ?? null,
                            'product' => [
                                'id' => $productIdOut,
                                'name' => $newItem['productName'] ?? 'Unknown Product',
                                'price' => isset($newItem['price']) ? (string) $newItem['price'] : '0',
                                'image' => $newItem['image'] ?? '/placeholder.svg',
                                'availability' => $newItem['availability'] ?? 'On Request',
                            ],
                        ];
                    }

                    api_json($newItem, 201);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            // Default POST handler
            api_json([
                'resource' => $resource,
                'action' => 'create',
                'received' => api_input(),
                'message' => 'Replace this stub with INSERT logic.',
            ], 201);

        case 'PUT':
        case 'PATCH':
            if ($resource === 'reviews' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $reviewRows = api_query_all(
                    $pdo,
                    'SELECT id, user_id AS userId, status FROM reviews WHERE id = :id LIMIT 1',
                    ['id' => $id]
                );
                $review = $reviewRows[0] ?? null;
                if (!$review) {
                    api_json(['error' => 'not_found'], 404);
                }
                if ((int) $review['userId'] !== (int) $user['id'] && $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'forbidden'], 403);
                }
                if ($review['status'] !== 'Pending' && $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'cannot_edit_review'], 400);
                }

                $input = api_input();
                $sets = [];
                $params = [':id' => $id];
                if (array_key_exists('rating', $input)) {
                    $rating = (int) $input['rating'];
                    if ($rating < 1 || $rating > 5) {
                        api_json(['error' => 'validation_error', 'message' => 'rating must be between 1 and 5'], 400);
                    }
                    $sets[] = 'rating = :rating';
                    $params[':rating'] = $rating;
                }
                if (array_key_exists('comment', $input)) {
                    $sets[] = 'comment = :comment';
                    $params[':comment'] = trim((string) $input['comment']);
                }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }

                $sets[] = 'updated_at = NOW()';
                $pdo->prepare('UPDATE reviews SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
                $updatedRows = api_query_all(
                    $pdo,
                    'SELECT id, product_id AS productId, user_id AS userId, user_name AS userName, rating, comment, status, created_at AS createdAt, updated_at AS updatedAt
                     FROM reviews WHERE id = :id LIMIT 1',
                    ['id' => $id]
                );
                $updated = $updatedRows[0] ?? null;
                if ($updated) {
                    $updated['id'] = (int) $updated['id'];
                    $updated['productId'] = (int) $updated['productId'];
                    $updated['userId'] = (int) $updated['userId'];
                    $updated['rating'] = (int) $updated['rating'];
                }
                api_json($updated ?? ['id' => $id]);
            }

            if ($resource === 'vendors' && $id !== null) {
                $user = api_current_user($pdo);
                // Allow admin or the vendor themselves to update
                if (!$user || ($user['role'] !== 'ADMIN' && (int) $user['vendor_id'] !== $id)) {
                    api_json(['error' => 'unauthorized', 'message' => 'You do not have permission to update this vendor.'], 403);
                }

                $vendorCheck = api_query_all($pdo, 'SELECT id FROM vendors WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($vendorCheck)) {
                    api_json(['error' => 'not_found'], 404);
                }

                $input = api_input();
                $updates = [];
                $params = ['id' => $id];

                $allowedFields = ['name', 'location', 'specialty', 'image', 'verification_status', 'is_active', 'certifications'];
                if ($user['role'] !== 'ADMIN') {
                    // Vendors can't change their own verification status or active status
                    $allowedFields = ['name', 'location', 'specialty', 'image', 'certifications'];
                }

                foreach ($allowedFields as $field) {
                    if (isset($input[$field])) {
                        $column = $field;
                        if ($field === 'verificationStatus') $column = 'verification_status';
                        if ($field === 'isActive') $column = 'is_active';

                        $value = $input[$field];
                        if ($field === 'certifications') {
                            $value = json_encode($value);
                        }
                        if ($field === 'is_active') {
                            $value = (int) filter_var($value, FILTER_VALIDATE_BOOLEAN);
                        }

                        $updates[] = "$column = :$field";
                        $params[$field] = $value;
                    }
                }

                if (empty($updates)) {
                    api_json(['error' => 'bad_request', 'message' => 'No fields to update.'], 400);
                }

                $updates[] = 'updated_at = NOW()';
                $sql = 'UPDATE vendors SET ' . implode(', ', $updates) . ' WHERE id = :id';

                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $updatedVendorResult = api_query_all($pdo, 'SELECT * FROM vendors WHERE id = :id', ['id' => $id]);
                    api_json($updatedVendorResult[0]);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => 'Failed to update vendor: ' . $e->getMessage()], 500);
                }
            }

            if ($resource === 'pricing-ranges' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can update pricing ranges.'], 403);
                }

                $existing = api_query_all($pdo, 'SELECT id FROM pricing_ranges WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($existing)) {
                    api_json(['error' => 'not_found'], 404);
                }

                $input = api_input();
                $sets = [];
                $params = [':id' => $id];
                if (array_key_exists('role', $input)) {
                    $role = strtoupper(trim((string) $input['role']));
                    if (!in_array($role, ['BUYER', 'VENDOR'], true)) {
                        api_json(['error' => 'validation_error', 'message' => 'Invalid role'], 400);
                    }
                    $sets[] = 'role = :role';
                    $params[':role'] = $role;
                }
                if (array_key_exists('label', $input)) { $sets[] = 'label = :label'; $params[':label'] = trim((string) $input['label']); }
                if (array_key_exists('min', $input)) { $sets[] = 'min_value = :min'; $params[':min'] = trim((string) $input['min']); }
                if (array_key_exists('max', $input)) { $sets[] = 'max_value = :max'; $params[':max'] = trim((string) $input['max']); }
                if (array_key_exists('description', $input)) { $sets[] = 'description = :desc'; $params[':desc'] = trim((string) $input['description']); }

                if (empty($sets)) {
                    api_json(['error' => 'No fields to update'], 400);
                }
                $sets[] = 'updated_at = NOW()';

                try {
                    $pdo->prepare('UPDATE pricing_ranges SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
                    $updated = api_query_all($pdo, 'SELECT id, role, label, min_value AS min, max_value AS max, description, created_at AS createdAt, updated_at AS updatedAt FROM pricing_ranges WHERE id = :id LIMIT 1', ['id' => $id]);
                    api_json($updated[0] ?? null);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'products' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                // Check if product exists
                $productResult = api_query_all($pdo, 'SELECT * FROM products WHERE id = :id LIMIT 1', ['id' => $id]);
                $product = $productResult[0] ?? null;
                if (!$product) {
                    api_json(['error' => 'not_found'], 404);
                }

                // Authorization: Allow admin or the product's vendor
                if ($user['role'] !== 'ADMIN' && (int) $user['vendor_id'] !== (int) $product['vendor_id']) {
                    api_json(['error' => 'forbidden', 'message' => 'You do not have permission to update this product.'], 403);
                }

                $input = api_input();
                $updates = [];
                $params = ['id' => $id];

                // List of updatable fields
                $allowedFields = ['name', 'category_id', 'price', 'description', 'reference_code', 'availability', 'status', 'warranty', 'warranty_status', 'image', 'photos'];

                foreach ($allowedFields as $field) {
                    if (isset($input[$field])) {
                        $column = $field;
                        // Handle camelCase to snake_case conversion for keys like 'categoryId'
                        if ($field === 'categoryId') $column = 'category_id';
                        if ($field === 'referenceCode') $column = 'reference_code';
                        if ($field === 'warrantyStatus') $column = 'warranty_status';

                        $updates[] = "$column = :$field";
                        $params[$field] = $input[$field];
                    }
                }


                if (empty($updates)) {
                    api_json(['error' => 'bad_request', 'message' => 'No fields to update.'], 400);
                }

                $updates[] = 'updated_at = NOW()';
                $sql = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = :id';

                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);

                    // Fetch and return updated product
                    $updatedProductResult = api_query_all($pdo, 'SELECT * FROM products WHERE id = :id', ['id' => $id]);
                    api_json($updatedProductResult[0]);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => 'Failed to update product: ' . $e->getMessage()], 500);
                }
            }

            if ($resource === 'pricing-ranges' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can delete pricing ranges.'], 403);
                }

                $exists = api_query_all($pdo, 'SELECT id FROM pricing_ranges WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($exists)) {
                    api_json(['error' => 'not_found'], 404);
                }

                try {
                    $pdo->prepare('DELETE FROM pricing_ranges WHERE id = :id')->execute(['id' => $id]);
                    api_json(['success' => true]);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'categories' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can update categories.'], 403);
                }

                // Check if category exists
                $categoryCheck = api_query_all($pdo, 'SELECT * FROM categories WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($categoryCheck)) {
                    api_json(['error' => 'not_found'], 404);
                }

                $input = api_input();
                $updates = [];
                $params = ['id' => $id];

                if (isset($input['name'])) {
                    $updates[] = 'name = :name';
                    $params['name'] = trim($input['name']);
                }
                if (isset($input['slug'])) {
                    $slug = trim($input['slug']);
                    // Check for duplicate slug
                    $slugCheck = api_query_all($pdo, 'SELECT id FROM categories WHERE slug = :slug AND id != :id LIMIT 1', ['slug' => $slug, 'id' => $id]);
                    if ($slugCheck) {
                        api_json(['error' => 'conflict', 'message' => 'A category with this slug already exists.'], 409);
                    }
                    $updates[] = 'slug = :slug';
                    $params['slug'] = $slug;
                }
                if (isset($input['description'])) {
                    $updates[] = 'description = :description';
                    $params['description'] = trim($input['description']);
                }
                if (isset($input['isActive'])) {
                    $updates[] = 'is_active = :isActive';
                    $params['isActive'] = (int) filter_var($input['isActive'], FILTER_VALIDATE_BOOLEAN);
                }

                if (empty($updates)) {
                    api_json(['error' => 'bad_request', 'message' => 'No fields to update.'], 400);
                }

                $updates[] = 'updated_at = NOW()';
                $sql = 'UPDATE categories SET ' . implode(', ', $updates) . ' WHERE id = :id';

                try {
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);

                    // Fetch and return updated category
                    $updatedCategoryResult = api_query_all($pdo, 'SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive, c.created_at AS createdAt, c.updated_at AS updatedAt, COUNT(p.id) AS productCount FROM categories c LEFT JOIN products p ON p.category_id = c.id WHERE c.id = :id GROUP BY c.id', ['id' => $id]);
                    $updatedCategory = $updatedCategoryResult[0];
                    $updatedCategory['isActive'] = (bool) $updatedCategory['isActive'];
                    $updatedCategory['productCount'] = (int) $updatedCategory['productCount'];


                    api_json($updatedCategory);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'cart' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $input = api_input();
                $quantity = isset($input['quantity']) ? (int) $input['quantity'] : null;

                if ($quantity === null || $quantity < 1) {
                    api_json(['error' => 'validation_error', 'message' => 'Valid quantity is required'], 400);
                }

                // Verify ownership
                $cartItemCheck = api_query_all($pdo, 'SELECT id FROM cart WHERE id = :id AND user_id = :userId LIMIT 1', ['id' => $id, 'userId' => (int) $user['id']]);
                if (empty($cartItemCheck)) {
                    api_json(['error' => 'not_found'], 404);
                }

                try {
                    $stmt = $pdo->prepare('UPDATE cart SET quantity = :quantity, updated_at = NOW() WHERE id = :id');
                    $stmt->execute([':quantity' => $quantity, ':id' => $id]);

                    $updatedRows = api_query_all(
                        $pdo,
                        'SELECT c.id, c.product_id AS productId, c.quantity, c.created_at AS createdAt, c.updated_at AS updatedAt, p.name AS productName, p.price, p.image, p.availability
                         FROM cart c
                         JOIN products p ON p.id = c.product_id
                         WHERE c.id = :id
                         LIMIT 1',
                        ['id' => $id]
                    );
                    $updated = $updatedRows[0] ?? null;
                    if (!$updated) {
                        api_json(['id' => $id, 'quantity' => $quantity]);
                    }

                    $productIdOut = (int) $updated['productId'];
                    api_json([
                        'id' => (int) $updated['id'],
                        'productId' => $productIdOut,
                        'quantity' => (int) $updated['quantity'],
                        'createdAt' => $updated['createdAt'],
                        'updatedAt' => $updated['updatedAt'],
                        'product' => [
                            'id' => $productIdOut,
                            'name' => $updated['productName'] ?? 'Unknown Product',
                            'price' => isset($updated['price']) ? (string) $updated['price'] : '0',
                            'image' => $updated['image'] ?? '/placeholder.svg',
                            'availability' => $updated['availability'] ?? 'On Request',
                        ],
                    ]);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            api_json([
                'resource' => $resource,
                'action' => 'update',
                'id' => $id,
                'received' => api_input(),
                'message' => 'Replace this stub with UPDATE logic.',
            ]);

        case 'DELETE':
            if ($resource === 'reviews' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                $reviewRows = api_query_all($pdo, 'SELECT user_id AS userId FROM reviews WHERE id = :id LIMIT 1', ['id' => $id]);
                $review = $reviewRows[0] ?? null;
                if (!$review) {
                    api_json(['error' => 'not_found'], 404);
                }
                if ((int) $review['userId'] !== (int) $user['id'] && $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'forbidden'], 403);
                }

                $pdo->prepare('DELETE FROM reviews WHERE id = :id')->execute([':id' => $id]);
                api_json(['success' => true]);
            }

            if ($resource === 'vendors' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can delete vendors.'], 403);
                }

                $vendorCheck = api_query_all($pdo, 'SELECT id FROM vendors WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($vendorCheck)) {
                    api_json(['error' => 'not_found'], 404);
                }

                // Check for dependencies like products
                $productCount = api_query_all($pdo, 'SELECT COUNT(*) as count FROM products WHERE vendor_id = :id', ['id' => $id]);
                if ($productCount[0]['count'] > 0) {
                    api_json(['error' => 'conflict', 'message' => 'Cannot delete vendor with associated products. Please reassign or delete them first.'], 409);
                }

                try {
                    $pdo->beginTransaction();

                    // Delete associated user(s) first
                    $pdo->prepare('DELETE FROM users WHERE vendor_id = :vendorId')->execute([':vendorId' => $id]);

                    // Delete the vendor
                    $pdo->prepare('DELETE FROM vendors WHERE id = :id')->execute([':id' => $id]);

                    $pdo->commit();
                    api_json(['message' => 'Vendor and associated user(s) deleted successfully.']);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    api_json(['error' => 'database_error', 'message' => 'Failed to delete vendor: ' . $e->getMessage()], 500);
                }
            }

            if ($resource === 'products' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                // Check if product exists
                $productResult = api_query_all($pdo, 'SELECT vendor_id FROM products WHERE id = :id LIMIT 1', ['id' => $id]);
                $product = $productResult[0] ?? null;
                if (!$product) {
                    api_json(['error' => 'not_found'], 404);
                }

                // Authorization: Allow admin or the product's vendor
                if ($user['role'] !== 'ADMIN' && (int) $user['vendor_id'] !== (int) $product['vendor_id']) {
                    api_json(['error' => 'forbidden', 'message' => 'You do not have permission to delete this product.'], 403);
                }

                try {
                    // Note: You might want to handle related records (order_items, cart, etc.)
                    // For simplicity, we'll just delete the product.
                    // A better approach might be to soft-delete or check for dependencies.
                    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
                    $stmt->execute([':id' => $id]);
                    api_json(['message' => 'Product deleted successfully']);
                } catch (Exception $e) {
                    // Catch foreign key constraint violations
                    if ($e->getCode() === '23000') {
                        api_json(['error' => 'conflict', 'message' => 'Cannot delete this product because it is referenced in existing orders or carts.'], 409);
                    }
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'categories' && $id !== null) {
                $user = api_current_user($pdo);
                if (!$user || $user['role'] !== 'ADMIN') {
                    api_json(['error' => 'unauthorized', 'message' => 'Only admins can delete categories.'], 403);
                }

                // Check if category exists
                $categoryCheck = api_query_all($pdo, 'SELECT id FROM categories WHERE id = :id LIMIT 1', ['id' => $id]);
                if (empty($categoryCheck)) {
                    api_json(['error' => 'not_found'], 404);
                }

                // Check if any products are using this category
                $productCountResult = api_query_all($pdo, 'SELECT COUNT(*) as count FROM products WHERE category_id = :id', ['id' => $id]);
                if ($productCountResult[0]['count'] > 0) {
                    api_json(['error' => 'conflict', 'message' => 'Cannot delete category with associated products. Reassign products first.'], 409);
                }

                try {
                    $stmt = $pdo->prepare('DELETE FROM categories WHERE id = :id');
                    $stmt->execute([':id' => $id]);
                    api_json(['message' => 'Category deleted successfully']);
                } catch (Exception $e) {
                    api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                }
            }

            if ($resource === 'cart') {
                $user = api_current_user($pdo);
                if (!$user) {
                    api_json(['error' => 'unauthorized'], 401);
                }

                // Handle clearing the whole cart
                if (isset($segments[0]) && $segments[0] === 'clear') {
                    try {
                        $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = :userId');
                        $stmt->execute([':userId' => (int) $user['id']]);
                        api_json(['message' => 'Cart cleared']);
                    } catch (Exception $e) {
                        api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                    }
                }

                // Handle deleting a single item
                if ($id !== null) {
                    // Verify ownership
                    $cartItemCheck = api_query_all($pdo, 'SELECT id FROM cart WHERE id = :id AND user_id = :userId LIMIT 1', ['id' => $id, 'userId' => (int) $user['id']]);
                    if (empty($cartItemCheck)) {
                        api_json(['error' => 'not_found'], 404);
                    }

                    try {
                        $stmt = $pdo->prepare('DELETE FROM cart WHERE id = :id');
                        $stmt->execute([':id' => $id]);
                        api_json(['message' => 'Item removed from cart']);
                    } catch (Exception $e) {
                        api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
                    }
                }
            }

            api_json([
                'resource' => $resource,
                'action' => 'delete',
                'id' => $id,
                'message' => 'Replace this stub with DELETE logic.',
            ]);

        default:
            api_method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    }
}
