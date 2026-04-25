<?php

function api_admin_auth_route(PDO $pdo, array $segments = []): void
{
    $action = strtolower((string) ($segments[0] ?? ''));
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    switch ($action) {
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
                'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = :email AND role = :role LIMIT 1'
            );
            $statement->execute([
                'email' => $email,
                'role' => 'ADMIN',
            ]);
            $admin = $statement->fetch();

            if (!$admin || (int) ($admin['is_active'] ?? 0) !== 1 || !password_verify($password, (string) $admin['password_hash'])) {
                api_json(['error' => 'invalid credentials'], 400);
            }

            api_json([
                'token' => api_jwt_encode([
                    'userId' => (int) $admin['id'],
                    'role' => 'ADMIN',
                ]),
                'admin' => [
                    'id' => (string) $admin['id'],
                    'name' => $admin['name'],
                    'email' => $admin['email'],
                    'role' => 'ADMIN',
                ],
            ]);

        case 'me':
            if ($method !== 'GET') {
                api_method_not_allowed(['GET']);
            }

            $admin = api_current_admin($pdo);
            if (!$admin) {
                api_json(['error' => 'invalid token'], 401);
            }

            api_json([
                'id' => (string) $admin['id'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'role' => 'ADMIN',
            ]);

        case 'logout':
            if (!in_array($method, ['POST', 'GET'], true)) {
                api_method_not_allowed(['GET', 'POST']);
            }

            api_json(['ok' => true]);

        default:
            api_json([
                'message' => 'Admin auth starter route',
                'actions' => ['login', 'me', 'logout'],
            ]);
    }
}
