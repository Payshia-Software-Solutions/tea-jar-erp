<?php
/**
 * Database Class
 * Handles PDO Connection and basic query execution.
 */

class Database {
    private $host;
    private $user = DB_USER;
    private $pass = DB_PASS;
    private $dbname = DB_NAME;

    private static $sharedDbh;
    private $dbh;
    private $stmt;
    private $error;

    public function __construct() {
        $this->host = defined('DB_HOST_OVERRIDE') ? DB_HOST_OVERRIDE : DB_HOST;
        if (self::$sharedDbh) {
            $this->dbh = self::$sharedDbh;
            return;
        }

        // Set DSN
        $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->dbname;
        $options = [
            // NOTE: ATTR_PERSISTENT intentionally removed.
            // Persistent connections reuse old MySQL socket state across PHP requests.
            // A previous request that ran DDL (CREATE/ALTER) or left a broken transaction
            // would corrupt the reused connection, causing beginTransaction() to silently
            // fail, resulting in "There is no active transaction" on commit().
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5 // 5 seconds timeout
        ];

        // Create PDO instance
        try {
            $this->dbh = new PDO($dsn, $this->user, $this->pass, $options);
            // Ensure MySQL uses Sri Lanka time for all CURRENT_TIMESTAMP and datetime functions
            $this->dbh->exec("SET time_zone = '+05:30'");
            self::$sharedDbh = $this->dbh;
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            // Don't echo here; let the caller handle it or check getError()
        }
    }

    public function getError() {
        return $this->error;
    }

    // Prepare statement with query
    public function query($sql) {
        if (!$this->dbh) {
            throw new Exception("Database connection failed: " . $this->error);
        }
        $this->stmt = $this->dbh->prepare($sql);
    }

    // Bind values
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        $this->stmt->bindValue($param, $value, $type);
    }

    // Execute the prepared statement
    public function execute() {
        return $this->stmt->execute();
    }

    // Execute a raw SQL statement directly on the connection (DDL/migrations).
    public function exec($sql) {
        if (!$this->dbh) {
            throw new Exception("Database connection failed: " . $this->error);
        }
        return $this->dbh->exec($sql);
    }

    // Execute a raw SQL statement and return the PDOStatement result
    public function rawQuery($sql) {
        if (!$this->dbh) {
            throw new Exception("Database connection failed: " . $this->error);
        }
        return $this->dbh->query($sql);
    }

    // Get result set as array of objects
    public function resultSet() {
        $this->execute();
        return $this->stmt->fetchAll(PDO::FETCH_OBJ);
    }

    // Get single record as object
    public function single() {
        $this->execute();
        return $this->stmt->fetch(PDO::FETCH_OBJ);
    }

    // Get single value (first column of first row)
    public function singleColumn() {
        $this->execute();
        return $this->stmt->fetchColumn();
    }

    // Get row count
    public function rowCount() {
        return $this->stmt->rowCount();
    }

    // Get the last inserted id for the current connection.
    public function lastInsertId() {
        if (!$this->dbh) {
            throw new Exception("Database connection failed: " . $this->error);
        }
        return $this->dbh->lastInsertId();
    }

    private static $transactionCount = 0;

    // Transaction Methods
    public function beginTransaction() {
        if (!$this->dbh) {
            throw new Exception("Database connection failed: " . $this->error);
        }
        if (self::$transactionCount === 0) {
            $this->dbh->beginTransaction();
        }
        self::$transactionCount++;
        return true;
    }

    public function commit() {
        if (self::$transactionCount > 0) {
            self::$transactionCount--;
            if (self::$transactionCount === 0) {
                try {
                    $res = $this->dbh->commit();
                    return $res;
                } catch (Exception $e) {
                    error_log("Database::commit() failed. Exception: " . $e->getMessage() . " TRACE: " . $e->getTraceAsString());
                    throw $e;
                }
            }
        } else {
            error_log("Database::commit() called while transactionCount is 0! " . (new Exception())->getTraceAsString());
        }
        return true;
    }

    public function rollBack() {
        if (self::$transactionCount > 0) {
            self::$transactionCount = 0; // Reset on error
            if ($this->dbh->inTransaction()) {
                return $this->dbh->rollBack();
            } else {
                error_log("Database::rollBack() called but inTransaction() is false! TRACE: " . (new Exception())->getTraceAsString());
            }
        }
        return true;
    }

    // Get the underlying PDO connection
    public function getDb() {
        return $this->dbh;
    }
}
