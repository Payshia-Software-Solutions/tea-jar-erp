<?php
/**
 * CityPostalSchema Helper
 * Adds postal_code to existing cities table.
 */

class CityPostalSchema {
    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    public static function ensure() {
        $pdo = self::pdo();

        // 1. Add postal_code column if missing
        $stmt = $pdo->prepare("SHOW COLUMNS FROM cities LIKE 'postal_code'");
        $stmt->execute();
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE cities ADD COLUMN postal_code VARCHAR(100) NULL AFTER name");
        }

        // 2. Seed some common postal codes
        $data = [
            'Colombo 01' => '00100',
            'Colombo 02' => '00200',
            'Colombo 03' => '00300',
            'Colombo 04' => '00400',
            'Colombo 05' => '00500',
            'Colombo 06' => '00600',
            'Colombo 07' => '00700',
            'Colombo 08' => '00800',
            'Kandy' => '20000',
            'Galle' => '80000',
            'Ratnapura' => '70000',
            'Ella' => '90175',
            'Nuwara Eliya' => '22200',
            'Negombo' => '11500',
            'Jaffna' => '40000',
            'Matara' => '81000',
            'Kurunegala' => '60000',
            'Anuradhapura' => '50000',
            'Polonnaruwa' => '51000',
            'Batticaloa' => '30000',
            'Trincomalee' => '31000',
            'Kalutara' => '12000',
            'Hambantota' => '82000',
            'Puttalam' => '61000',
            'Kegalle' => '71000',
            'Monaragala' => '91000',
        ];

        foreach ($data as $city => $code) {
            $stmt = $pdo->prepare("UPDATE cities SET postal_code = ? WHERE name = ? AND (postal_code IS NULL OR postal_code = '')");
            $stmt->execute([$code, $city]);
        }
    }
}
