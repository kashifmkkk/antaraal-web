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
                if ($productId !== null) {
                    $sql .= ' WHERE r.product_id = :productId';
                    $params['productId'] = $productId;
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

            // Default POST handler
            api_json([
                'resource' => $resource,
                'action' => 'create',
                'received' => api_input(),
                'message' => 'Replace this stub with INSERT logic.',
            ], 201);

        case 'PUT':
        case 'PATCH':
            api_json([
                'resource' => $resource,
                'action' => 'update',
                'id' => $id,
                'received' => api_input(),
                'message' => 'Replace this stub with UPDATE logic.',
            ]);

        case 'DELETE':
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
