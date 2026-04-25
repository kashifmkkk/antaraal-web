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
        $required = ['vendorName', 'name', 'email', 'password'];
        foreach ($required as $field) {
            if (trim((string) ($input[$field] ?? '')) === '') {
                api_json(['error' => $field . ' required'], 400);
            }
        }

        api_json([
            'message' => 'Vendor registration starter',
            'expected' => [
                'vendorName',
                'name',
                'email',
                'password',
                'location',
                'specialty',
                'certifications',
            ],
            'received' => $input,
        ], 201);
    }

    api_resource_route($pdo, 'vendors', $segments);
}
