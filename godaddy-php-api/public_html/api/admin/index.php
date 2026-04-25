<?php

require_once __DIR__ . '/../config/bootstrap.php';

$segments = api_path_segments('api');
$firstSegment = strtolower((string) ($segments[0] ?? ''));
if ($firstSegment === 'admin') {
    array_shift($segments);
}

$module = strtolower((string) array_shift($segments));

switch ($module) {
    case 'auth':
        require_once __DIR__ . '/../routes/admin/auth.php';
        api_admin_auth_route($pdo, $segments);

    case 'dashboard':
    case 'inventory':
    case 'users':
    case 'vendors':
    case 'rfqs':
    case 'quotes':
    case 'orders':
    case 'mro':
    case 'warranty':
    case 'warranty-claims':
    case 'complaints':
    case 'reviews':
    case 'analytics':
    case 'categories':
    case 'settings':
    case 'notifications':
    case 'uploads':
        require_once __DIR__ . '/../routes/admin/resource.php';
        api_admin_resource_route($pdo, $module, $segments);

    case 'products':
        require_once __DIR__ . '/../routes/admin/resource.php';
        api_admin_resource_route($pdo, 'inventory', array_merge($segments, ['approve']));

    default:
        api_json([
            'error' => 'not_found',
            'module' => $module,
        ], 404);
}
