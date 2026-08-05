<?php
require_once __DIR__ . '/laundrop-api/bootstrap/app.php';

$app = require_once __DIR__ . '/laundrop-api/bootstrap/app.php';

// Get database connection and check users
$pdo = PDO::createConnection(); // This won't work directly, let's try another way

// Use artisan to query
passthru('cd laundrop-api && php artisan tinker --execute "
echo \"Users in database:\n\";
\$users = DB::table(\"users\")->select(\"id\", \"name\", \"email\", \"role\")->get();
foreach (\$users as \$user) {
    echo \$user->id . \" | \" . \$user->name . \" | \" . \$user->email . \" | \" . \$user->role . \"\n\";
}

echo \"\nNotifications count:\";
echo DB::table(\"order_notifications\")->count();
"');
?>
