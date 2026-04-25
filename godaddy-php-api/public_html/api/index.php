<?php

require_once __DIR__ . '/config/bootstrap.php';

$segments = api_path_segments('api');
$module = strtolower((string) array_shift($segments));

switch ($module) {
    case '':
    case 'health':
        api_json([
            'status' => 'ok',
            'message' => 'Skyway PHP API starter',
        ]);

    case 'auth':
        require_once __DIR__ . '/routes/auth.php';
        api_auth_route($pdo, $segments);

    case 'vendors':
        require_once __DIR__ . '/routes/vendors.php';
        api_vendors_route($pdo, $segments);

    case 'products':
    case 'categories':
    case 'cart':
    case 'orders':
    case 'rfqs':
    case 'quotes':
    case 'reviews':
    case 'notifications':
    case 'warranties':
    case 'warranty-claims':
        require_once __DIR__ . '/routes/resource.php';
        api_resource_route($pdo, $module, $segments);

    case 'admin':
        require_once __DIR__ . '/admin/index.php';
        exit;

    default:
        api_json([
            'error' => 'not_found',
            'module' => $module,
        ], 404);
}
