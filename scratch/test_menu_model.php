<?php
require_once __DIR__ . '/../server/config/config.php';
require_once __DIR__ . '/../server/app/core/Database.php';
require_once __DIR__ . '/../server/app/core/Model.php';
require_once __DIR__ . '/../server/app/models/StorefrontMenu.php';

$model = new StorefrontMenu();

echo "Testing StorefrontMenu model...\n";

try {
    $data = [
        'label' => 'Test Menu Item ' . time(),
        'parent_id' => null,
        'link_type' => 'Internal',
        'link_value' => '/test',
        'sort_order' => 0,
        'is_active' => 1
    ];

    echo "Creating item...\n";
    $id = $model->create($data);
    if ($id) {
        echo "Successfully created item with ID: $id\n";
        
        echo "Updating item...\n";
        $data['label'] = 'Updated Label ' . time();
        if ($model->update($id, $data)) {
            echo "Successfully updated item.\n";
        } else {
            echo "Failed to update item.\n";
        }
        
        echo "Deleting item...\n";
        if ($model->delete($id)) {
            echo "Successfully deleted item.\n";
        } else {
            echo "Failed to delete item.\n";
        }
    } else {
        echo "Failed to create item.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
