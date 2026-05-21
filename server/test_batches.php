<?php 
require 'app/config/config.php'; 
require 'app/core/Database.php'; 
require 'app/core/Model.php';
require 'app/models/InventoryBatch.php';
$db = new Database(); 
$model = new InventoryBatch();
$batches = $model->getAvailableBatches(35, 1);  // Use part ID 35 or something, I don't know the part ID
print_r($batches);

