<?php
require __DIR__ . '/laundrop-api/vendor/autoload.php';

$app = require __DIR__ . '/laundrop-api/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "📋 Checking order_notifications table structure...\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$columns = Schema::getColumns('order_notifications');
foreach ($columns as $column) {
    if ($column['name'] === 'type') {
        echo "Type Column:\n";
        echo "  Name: " . $column['name'] . "\n";
        echo "  Type: " . $column['type'] . "\n";
        echo "  Nullable: " . ($column['nullable'] ? 'Yes' : 'No') . "\n";
        if (isset($column['comment'])) {
            echo "  Comment: " . $column['comment'] . "\n";
        }
    }
}

// Check existing type values
echo "\n📊 Existing notification types in database:\n";
$types = DB::table('order_notifications')
    ->distinct()
    ->pluck('type')
    ->toArray();

foreach ($types as $type) {
    $count = DB::table('order_notifications')->where('type', $type)->count();
    echo "  • $type: $count records\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
?>
