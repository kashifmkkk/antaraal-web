<?php

function api_auth_route(PDO $pdo, array $segments = []): void
{
    $action = strtolower((string) ($segments[0] ?? ''));
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    switch ($action) {
        case 'register':
            if ($method !== 'POST') {
                api_method_not_allowed(['POST']);
            }

            $input = api_input();
            $name = trim((string) ($input['name'] ?? ''));
            $email = trim((string) ($input['email'] ?? ''));
            $password = (string) ($input['password'] ?? '');

            if ($name === '' || $email === '' || $password === '') {
                api_json(['error' => 'name,email,password required'], 400);
            }

            $statement = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $statement->execute(['email' => $email]);
            if ($statement->fetch()) {
                api_json(['error' => 'email exists'], 400);
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $insert = $pdo->prepare(
                'INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)'
            );
            $insert->execute([
                'name' => $name,
                'email' => $email,
                'password_hash' => $hash,
                'role' => 'BUYER',
            ]);

            $userId = (int) $pdo->lastInsertId();
            api_json([
                'token' => api_jwt_encode(['userId' => $userId, 'role' => 'BUYER']),
                'user' => [
                    'id' => $userId,
                    'name' => $name,
                    'email' => $email,
                    'role' => 'BUYER',
                    'vendorId' => null,
                ],
            ], 201);

        case 'login':
            if ($method !== 'POST') {
                api_method_not_allowed(['POST']);
            }

            $input = api_input();
            $email = trim((string) ($input['email'] ?? ''));
            $password = (string) ($input['password'] ?? '');

            if ($email === '' || $password === '') {
                api_json(['error' => 'email,password required'], 400);
            }

            $statement = $pdo->prepare(
                'SELECT id, name, email, password_hash, role, is_active, vendor_id FROM users WHERE email = :email LIMIT 1'
            );
            $statement->execute(['email' => $email]);
            $user = $statement->fetch();

            if (!$user || (int) ($user['is_active'] ?? 0) !== 1 || !password_verify($password, (string) $user['password_hash'])) {
                api_json(['error' => 'invalid credentials'], 400);
            }

            api_json([
                'token' => api_jwt_encode([
                    'userId' => (int) $user['id'],
                    'role' => $user['role'],
                    'vendorId' => $user['vendor_id'] !== null ? (int) $user['vendor_id'] : null,
                ]),
                'user' => [
                    'id' => (int) $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'vendorId' => $user['vendor_id'] !== null ? (int) $user['vendor_id'] : null,
                ],
            ]);

        case 'me':
            if ($method !== 'GET') {
                api_method_not_allowed(['GET']);
            }

            $user = api_current_user($pdo);
            if (!$user) {
                api_json(['error' => 'invalid token'], 401);
            }

            api_json([
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'vendorId' => $user['vendor_id'] !== null ? (int) $user['vendor_id'] : null,
                'isActive' => (bool) $user['is_active'],
            ]);

        case 'logout':
            if (!in_array($method, ['POST', 'GET'], true)) {
                api_method_not_allowed(['GET', 'POST']);
            }

            api_json(['ok' => true]);

        default:
            api_json([
                'message' => 'Auth starter route',
                'actions' => ['register', 'login', 'me', 'logout'],
            ]);
    }
}
