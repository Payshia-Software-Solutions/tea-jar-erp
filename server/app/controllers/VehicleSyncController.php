<?php
/**
 * VehicleSyncController - Handles external API integration for Fleet Management
 */
class VehicleSyncController extends Controller {
    private $vehicleModel;
    private $systemSettingModel;

    public function __construct() {
        $this->vehicleModel = $this->model('Vehicle');
        $this->systemSettingModel = $this->model('SystemSetting');
    }

    /**
     * GET /api/vehiclesync/mileage/:vin
     * Fetches real-time mileage for a specific vehicle
     */
    public function get_mileage($vin) {
        $this->requirePermission('vehicles.read');
        
        try {
            $apiUrl = $this->systemSettingModel->get('MILEAGE_API_URL') ?: MILEAGE_API_URL;
            $apiToken = $this->systemSettingModel->get('MILEAGE_API_TOKEN') ?: MILEAGE_API_TOKEN;

            if (!$apiUrl || !$apiToken) {
                $this->error("Mileage API configuration missing.");
                return;
            }

            $mileage = $this->fetchMileageForVehicle($apiUrl, $apiToken, $vin);
            
            if ($mileage !== null) {
                $this->success(['mileage' => $mileage]);
            } else {
                $this->error("Could not fetch mileage for $vin");
            }
        } catch (Exception $e) {
            $this->error($e->getMessage());
        }
    }

    private function fetchMileageForVehicle($baseUrl, $token, $vehicleNo) {
        $url = $baseUrl . "?Token=" . $token . "&VehicleNo=" . urlencode($vehicleNo);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) return null;

        $data = json_decode($response, true);
        if (isset($data['status']) && $data['status'] === 'success' && isset($data['gps_mileage'])) {
            return (int)$data['gps_mileage'];
        }

        return null;
    }

    /**
     * POST /api/vehiclesync/sync_single
     * Expects JSON: { "id": 1, "vin": "PY-1234" }
     */
    public function sync_single() {
        $this->requirePermission('vehicles.write');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: [];
        $vin = $data['vin'] ?? '';
        $id = $data['id'] ?? 0;

        if (!$vin || !$id) {
            $this->error("Missing vin or id.");
            return;
        }

        try {
            $apiUrl = $this->systemSettingModel->get('MILEAGE_API_URL') ?: MILEAGE_API_URL;
            $apiToken = $this->systemSettingModel->get('MILEAGE_API_TOKEN') ?: MILEAGE_API_TOKEN;

            if (!$apiUrl || !$apiToken) {
                $this->error("Mileage API configuration missing.");
                return;
            }

            $mileage = $this->fetchMileageForVehicle($apiUrl, $apiToken, $vin);
            $db = new \Database();
            if ($mileage !== null && $mileage > 0) {
                $db->query("UPDATE vehicles SET current_mileage = GREATEST(COALESCE(current_mileage, 0), :m), mileage_sync_status = 'success' WHERE id = :vid");
                $db->bind(':m', $mileage);
                $db->bind(':vid', $id);
                $db->execute();
                
                $this->success(['updated' => true, 'mileage' => $mileage]);
            } else {
                $db->query("UPDATE vehicles SET mileage_sync_status = 'failed' WHERE id = :vid");
                $db->bind(':vid', $id);
                $db->execute();
                $this->success(['updated' => false, 'mileage' => null]);
            }
        } catch (Exception $e) {
            $this->error('Mileage sync failed: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/vehiclesync/sync
     */
    public function sync() {
        $this->requirePermission('vehicles.write');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        try {
            $externalData = $this->fetchFromExternalApi();

            if (empty($externalData)) {
                $this->success(['total' => 0], "No vehicles found in external API.");
                return;
            }

            $deptModel = $this->model('Department');
            $allDepts = $deptModel->getAll();
            $deptMap = [];
            foreach ($allDepts as $d) {
                $deptMap[strtolower(trim($d->name))] = $d->id;
            }

            $results = [
                'total' => count($externalData),
                'success' => 0,
                'failed' => 0
            ];

            foreach ($externalData as $item) {
                $apiLocation = $item['location'] ?? null;
                $deptId = null;

                if ($apiLocation) {
                    $lookupKey = strtolower(trim($apiLocation));
                    if (isset($deptMap[$lookupKey])) {
                        $deptId = $deptMap[$lookupKey];
                    }
                }

                $mappedData = [
                    'external_id'       => $item['V_id'] ?? null,
                    'external_make'     => $item['type'] ?? 'Unknown',
                    'external_model'    => $item['Modle'] ?? 'Unknown',
                    'vin'               => $item['V_id'] ?? '', 
                    'category'          => $item['V_catagory'] ?? null,
                    'work_type'         => $item['assing_work'] ?? null,
                    'external_location' => $apiLocation,
                    'department_id'     => $deptId,
                    'driver_name'       => $item['U_name'] ?? null,
                    'fuel_capacity'     => $item['fuel_tank_capacity'] ?? null
                ];

                if (!$mappedData['external_id']) continue;

                if ($this->vehicleModel->upsertFromApi($mappedData)) {
                    $results['success']++;
                } else {
                    $results['failed']++;
                }
            }

            $this->success($results, "Synchronization completed.");
        } catch (Exception $e) {
            $this->error('Sync failed: ' . $e->getMessage());
        }
    }

    private function fetchFromExternalApi() {
        $apiUrl = $this->systemSettingModel->get('FLEET_API_URL') ?: FLEET_API_URL;
        $apiToken = $this->systemSettingModel->get('FLEET_API_TOKEN') ?: FLEET_API_TOKEN;

        $url = $apiUrl . '?Token=' . $apiToken;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            throw new Exception('CURL Error: ' . curl_error($ch));
        }
        
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("API returned HTTP $httpCode");
        }

        $data = json_decode($response, true);
        
        if (isset($data['data'])) return $data['data'];
        if (isset($data['vehicles'])) return $data['vehicles'];
        
        return is_array($data) ? $data : [];
    }

    /**
     * POST /api/vehiclesync/morning_fetch
     * Fetches morning mileage for all API vehicles concurrently and updates morning_mileage column.
     * Also copies current_mileage to morning_mileage for manual vehicles.
     */
    public function morning_fetch() {
        $this->requirePermission('vehicles.write');

        try {
            $apiUrl = $this->systemSettingModel->get('MILEAGE_API_URL') ?: MILEAGE_API_URL;
            $apiToken = $this->systemSettingModel->get('MILEAGE_API_TOKEN') ?: MILEAGE_API_TOKEN;

            if (!$apiUrl || !$apiToken) {
                $this->error("Mileage API configuration missing.");
                return;
            }

            $db = new \Database();
            
            // First, copy current_mileage to morning_mileage for manual vehicles to ensure their schedule works
            $db->query("UPDATE vehicles SET morning_mileage = COALESCE(current_mileage, 0) WHERE source != 'api' OR source IS NULL");
            $db->execute();

            // Get all API vehicles with VIN
            $json = file_get_contents('php://input');
            $postData = json_decode($json, true);
            $vehicleIds = $postData['vehicle_ids'] ?? null;
            
            $query = "SELECT id, vin FROM vehicles WHERE source = 'api' AND vin IS NOT NULL AND vin != ''";
            if (is_array($vehicleIds) && count($vehicleIds) > 0) {
                $in = implode(',', array_map('intval', $vehicleIds));
                $query .= " AND id IN ($in)";
            }
            
            $db->query($query);
            $vehicles = $db->resultSet();

            if (empty($vehicles)) {
                $this->success(['updated' => 0], "No API vehicles found to sync.");
                return;
            }

            $batches = array_chunk($vehicles, 50);
            $totalUpdated = 0;

            foreach ($batches as $batch) {
                $multi = curl_multi_init();
                $channels = [];

                foreach ($batch as $v) {
                    $url = $apiUrl . "?Token=" . $apiToken . "&VehicleNo=" . urlencode($v->vin);
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_multi_add_handle($multi, $ch);
                    $channels[] = [
                        'ch' => $ch,
                        'id' => $v->id
                    ];
                }

                $active = null;
                do {
                    $mrc = curl_multi_exec($multi, $active);
                } while ($mrc == CURLM_CALL_MULTI_PERFORM);

                while ($active && $mrc == CURLM_OK) {
                    if (curl_multi_select($multi) != -1) {
                        do {
                            $mrc = curl_multi_exec($multi, $active);
                        } while ($mrc == CURLM_CALL_MULTI_PERFORM);
                    }
                }

                foreach ($channels as $item) {
                    $ch = $item['ch'];
                    $vId = $item['id'];
                    $response = curl_multi_getcontent($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    
                    if ($httpCode === 200 && $response) {
                        $data = json_decode($response, true);
                        if (isset($data['status']) && $data['status'] === 'success' && isset($data['gps_mileage'])) {
                            $mileage = (int)$data['gps_mileage'];
                            if ($mileage > 0) {
                                $db->query("UPDATE vehicles SET morning_mileage = GREATEST(COALESCE(morning_mileage, 0), :m), mileage_sync_status = 'success' WHERE id = :vid");
                                $db->bind(':m', $mileage);
                                $db->bind(':vid', $vId);
                                $db->execute();
                                $totalUpdated++;
                            } else {
                                $db->query("UPDATE vehicles SET mileage_sync_status = 'failed' WHERE id = :vid");
                                $db->bind(':vid', $vId);
                                $db->execute();
                            }
                        } else {
                            $db->query("UPDATE vehicles SET mileage_sync_status = 'failed' WHERE id = :vid");
                            $db->bind(':vid', $vId);
                            $db->execute();
                        }
                    } else {
                        $db->query("UPDATE vehicles SET mileage_sync_status = 'failed' WHERE id = :vid");
                        $db->bind(':vid', $vId);
                        $db->execute();
                    }
                    curl_multi_remove_handle($multi, $ch);
                    curl_close($ch);
                }
                curl_multi_close($multi);
            }

            $this->success(['updated' => $totalUpdated], "Morning mileage sync completed successfully.");
        } catch (Exception $e) {
            $this->error('Morning mileage sync failed: ' . $e->getMessage());
        }
    }
}
