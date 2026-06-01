<?php require 'config/config.php'; require 'app/core/Database.php'; require 'app/models/PosHeldOrder.php'; \ = new PosHeldOrder(); echo json_encode(\->list(1));
