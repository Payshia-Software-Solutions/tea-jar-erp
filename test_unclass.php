<?php 
require 'server/app/config/config.php'; 
require 'server/app/core/Database.php'; 
require 'server/app/core/Model.php';
require 'server/app/models/InventoryBatch.php';
$db = new Database(); 
$model = new InventoryBatch();
$model->db = $db;
$batches = $model->getAvailableBatches(1, 1); 
print_r($batches);

