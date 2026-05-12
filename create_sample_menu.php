<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Create Main "Shop" Menu
$stmt = $pdo->prepare("INSERT INTO storefront_menus (label, link_type, link_value, is_mega_menu, sort_order) VALUES (?, ?, ?, ?, ?)");
$stmt->execute(['Shop', 'Internal', '/shop', 1, 1]);
$shop_id = $pdo->lastInsertId();

// 2. Create "SHOP TEA" Heading
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, sort_order) VALUES (?, ?, ?, ?)");
$stmt->execute([$shop_id, 'SHOP TEA', 'Heading', 1]);
$shop_tea_id = $pdo->lastInsertId();

// Add items under "SHOP TEA"
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$shop_tea_id, 'Shop All Teas', 'Internal', '/shop/all', 1]);
$stmt->execute([$shop_tea_id, 'Advent Calendar', 'Internal', '/shop/advent-calendar', 2]);

// 3. Create "SHOP BY TEA" Heading
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, sort_order) VALUES (?, ?, ?, ?)");
$stmt->execute([$shop_id, 'SHOP BY TEA', 'Heading', 2]);
$shop_by_id = $pdo->lastInsertId();

// Add items under "SHOP BY TEA"
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$shop_by_id, 'Black Tea', 'Internal', '/shop/black-tea', 1]);
$stmt->execute([$shop_by_id, 'Green Tea', 'Internal', '/shop/green-tea', 2]);
$stmt->execute([$shop_by_id, 'Herbal Tea', 'Internal', '/shop/herbal-tea', 3]);

// 4. Create "TEA FORMAT" Heading
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, sort_order) VALUES (?, ?, ?, ?)");
$stmt->execute([$shop_id, 'TEA FORMAT', 'Heading', 3]);
$format_id = $pdo->lastInsertId();

// Add items under "TEA FORMAT"
$stmt = $pdo->prepare("INSERT INTO storefront_menus (parent_id, label, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$format_id, 'Loose Leaf', 'Internal', '/shop/format/loose-leaf', 1]);
$stmt->execute([$format_id, 'Tea Bags', 'Internal', '/shop/format/tea-bags', 2]);
$stmt->execute([$format_id, 'Luxury Leaf Tea Bags', 'Internal', '/shop/format/luxury-bags', 3]);

echo "Sample Mega Menu created successfully!\n";
