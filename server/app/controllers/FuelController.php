<?php
/**
 * FuelController - Handles Fuel Management for Fleet
 */
class FuelController extends Controller {

    public function __construct() {
        // Permissions or auth check can be added here
    }

    // --- FUEL STATIONS ---

    public function get_stations() {
        $db = new \Database();
        $db->query("SELECT * FROM fleet_fuel_stations ORDER BY name ASC");
        $stations = $db->resultSet();
        $this->success(['stations' => $stations]);
    }

    public function create_station() {
        $data = $this->getJsonInput();
        if (empty($data['name']) || empty($data['type'])) {
            $this->error("Name and Type are required.");
            return;
        }

        $db = new \Database();
        $db->query("INSERT INTO fleet_fuel_stations (name, type, status) VALUES (:name, :type, :status)");
        $db->bind(':name', $data['name']);
        $db->bind(':type', $data['type']);
        $db->bind(':status', $data['status'] ?? 'active');
        $db->execute();

        $this->success(['message' => 'Station created successfully', 'id' => $db->lastInsertId()]);
    }

    // --- FUEL TYPES ---

    public function get_types() {
        $db = new \Database();
        $db->query("SELECT * FROM fleet_fuel_types ORDER BY name ASC");
        $types = $db->resultSet();
        $this->success(['types' => $types]);
    }

    public function create_type() {
        $data = $this->getJsonInput();
        if (empty($data['name'])) {
            $this->error("Fuel type name is required.");
            return;
        }

        $price = isset($data['price_per_liter']) ? (float)$data['price_per_liter'] : 0.00;

        $db = new \Database();
        // Check if exists, update price
        $db->query("SELECT id FROM fleet_fuel_types WHERE name = :name LIMIT 1");
        $db->bind(':name', $data['name']);
        $existing = $db->single();

        if ($existing) {
            $db->query("UPDATE fleet_fuel_types SET price_per_liter = :price WHERE id = :id");
            $db->bind(':price', $price);
            $db->bind(':id', $existing['id']);
            $db->execute();
            $this->success(['message' => 'Fuel type updated successfully', 'id' => $existing['id']]);
        } else {
            $db->query("INSERT INTO fleet_fuel_types (name, price_per_liter) VALUES (:name, :price)");
            $db->bind(':name', $data['name']);
            $db->bind(':price', $price);
            $db->execute();
            $this->success(['message' => 'Fuel type created successfully', 'id' => $db->lastInsertId()]);
        }
    }

    // --- FUEL ORDERS ---

    public function get_orders() {
        $db = new \Database();
        $db->query("
            SELECT o.*, 
                   v.vin as vehicle_no, 
                   CONCAT(e.first_name, ' ', e.last_name) as driver_name, 
                   s.name as station_name,
                   t.name as fuel_type_name,
                   u.name as created_by_name
            FROM fleet_fuel_orders o
            LEFT JOIN vehicles v ON o.vehicle_id = v.id
            LEFT JOIN employees e ON o.driver_id = e.id
            LEFT JOIN fleet_fuel_stations s ON o.fuel_station_id = s.id
            LEFT JOIN fleet_fuel_types t ON o.fuel_type_id = t.id
            LEFT JOIN users u ON o.created_by = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $db->resultSet();
        $this->success(['orders' => $orders]);
    }

    public function get_order($id) {
        $db = new \Database();
        $db->query("
            SELECT o.*, 
                   v.vin as vehicle_no, 
                   CONCAT(e.first_name, ' ', e.last_name) as driver_name, 
                   s.name as station_name,
                   t.name as fuel_type_name,
                   u.name as created_by_name
            FROM fleet_fuel_orders o
            LEFT JOIN vehicles v ON o.vehicle_id = v.id
            LEFT JOIN employees e ON o.driver_id = e.id
            LEFT JOIN fleet_fuel_stations s ON o.fuel_station_id = s.id
            LEFT JOIN fleet_fuel_types t ON o.fuel_type_id = t.id
            LEFT JOIN users u ON o.created_by = u.id
            WHERE o.id = :id
        ");
        $db->bind(':id', $id);
        $order = $db->single();
        if ($order) {
            $this->success($order);
        } else {
            $this->error("Order not found", 404);
        }
    }

    public function create_order() {
        $data = $this->getJsonInput();
        
        $required = ['vehicle_id', 'fuel_station_id', 'fuel_type_id', 'liters', 'price_per_liter', 'mileage'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                $this->error("Missing required field: $field");
                return;
            }
        }

        $liters = (float)$data['liters'];
        $price = (float)$data['price_per_liter'];
        $total_cost = $liters * $price;

        $db = new \Database();
        $db->query("
            INSERT INTO fleet_fuel_orders 
            (vehicle_id, driver_id, fuel_station_id, fuel_type_id, liters, price_per_liter, total_cost, mileage, created_by)
            VALUES 
            (:vehicle_id, :driver_id, :station_id, :type_id, :liters, :price, :total_cost, :mileage, :created_by)
        ");
        
        $db->bind(':vehicle_id', $data['vehicle_id']);
        $db->bind(':driver_id', $data['driver_id'] ?? null);
        $db->bind(':station_id', $data['fuel_station_id']);
        $db->bind(':type_id', $data['fuel_type_id']);
        $db->bind(':liters', $liters);
        $db->bind(':price', $price);
        $db->bind(':total_cost', $total_cost);
        $db->bind(':mileage', $data['mileage']);
        $db->bind(':created_by', $this->getCurrentUserId() ?? null); // Assuming this method exists, else null

        if ($db->execute()) {
            $this->success(['message' => 'Fuel order created successfully', 'id' => $db->lastInsertId(), 'total_cost' => $total_cost]);
        } else {
            $this->error("Failed to create fuel order.");
        }
    }
    
    private function getJsonInput() {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?: [];
    }
    
    private function getCurrentUserId() {
        // Implement logic to get current user ID if available in session/headers
        // For now, return a dummy user ID or null
        return 1; 
    }
}
