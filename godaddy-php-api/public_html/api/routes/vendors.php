<?php

require_once __DIR__ . '/resource.php';

function api_vendors_route(PDO $pdo, array $segments = []): void
{
    $action = strtolower((string) ($segments[0] ?? ''));

    if ($action === 'register') {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            api_method_not_allowed(['POST']);
        }

        $input = api_input();
        $required = ['vendorName', 'email', 'password'];
        foreach ($required as $field) {
            if (trim((string) ($input[$field] ?? '')) === '') {
                api_json(['error' => $field . ' required'], 400);
            }
        }

        $vendorName = trim((string) ($input['vendorName'] ?? ''));
        $name = trim((string) ($input['name'] ?? $vendorName));
        $email = trim((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $location = trim((string) ($input['location'] ?? ($input['vendorLocation'] ?? '')));
        $specialty = trim((string) ($input['specialty'] ?? ($input['vendorSpecialty'] ?? '')));
        $certifications = $input['certifications'] ?? [];
        if (!is_array($certifications)) {
            $certifications = [];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            api_json(['error' => 'invalid email'], 400);
        }

        if (strlen($password) < 6) {
            api_json(['error' => 'password must be at least 6 characters'], 400);
        }

        $existingUser = api_query_all($pdo, 'SELECT id FROM users WHERE email = :email LIMIT 1', ['email' => $email]);
        if (!empty($existingUser)) {
            api_json(['error' => 'email already exists'], 400);
        }

        $existingVendor = api_query_all($pdo, 'SELECT id FROM vendors WHERE name = :name LIMIT 1', ['name' => $vendorName]);
        if (!empty($existingVendor)) {
            api_json(['error' => 'vendor already exists'], 400);
        }

        try {
            $pdo->beginTransaction();

            $vendorStmt = $pdo->prepare(
                'INSERT INTO vendors (name, location, specialty, verification_status, is_active, certifications, created_at, updated_at)
                 VALUES (:name, :location, :specialty, :verificationStatus, :isActive, :certifications, NOW(), NOW())'
            );
            $vendorStmt->execute([
                ':name' => $vendorName,
                ':location' => $location !== '' ? $location : null,
                ':specialty' => $specialty !== '' ? $specialty : null,
                ':verificationStatus' => 'Pending',
                ':isActive' => 1,
                ':certifications' => json_encode(array_values($certifications)),
            ]);

            $vendorId = (int) $pdo->lastInsertId();

            $userStmt = $pdo->prepare(
                'INSERT INTO users (name, email, password_hash, role, is_active, vendor_id, created_at, updated_at)
                 VALUES (:name, :email, :passwordHash, :role, :isActive, :vendorId, NOW(), NOW())'
            );
            $userStmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':passwordHash' => password_hash($password, PASSWORD_DEFAULT),
                ':role' => 'VENDOR',
                ':isActive' => 1,
                ':vendorId' => $vendorId,
            ]);

            $userId = (int) $pdo->lastInsertId();
            $pdo->commit();

            api_json([
                'token' => api_jwt_encode([
                    'userId' => $userId,
                    'role' => 'VENDOR',
                    'vendorId' => $vendorId,
                ]),
                'user' => [
                    'id' => $userId,
                    'name' => $name,
                    'email' => $email,
                    'role' => 'VENDOR',
                    'vendorId' => $vendorId,
                    'isActive' => true,
                ],
                'vendor' => [
                    'id' => $vendorId,
                    'name' => $vendorName,
                    'location' => $location !== '' ? $location : null,
                    'specialty' => $specialty !== '' ? $specialty : null,
                    'verificationStatus' => 'Pending',
                ],
            ], 201);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            api_json(['error' => 'database_error', 'message' => $e->getMessage()], 500);
        }
    }

    api_resource_route($pdo, 'vendors', $segments);
}
