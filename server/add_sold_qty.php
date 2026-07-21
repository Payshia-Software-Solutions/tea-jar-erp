<?php
require_once 'app/core/Database.php';
require_once 'config/config.php';
$db = new Database();
$db->query("ALTER TABLE customer_stocks ADD COLUMN sold_qty decimal(10,2) NOT NULL DEFAULT 0.00 AFTER quantity;");
$db->execute();
echo 'Added sold_qty column';
