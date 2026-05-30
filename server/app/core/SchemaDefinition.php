<?php

class SchemaDefinition {
    public static function get() {
        return array (
  'acc_accounts' => 
  array (
    'name' => 'acc_accounts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'code' => 
      array (
        'Field' => 'code',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'ASSET\',\'LIABILITY\',\'EQUITY\',\'INCOME\',\'EXPENSE\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category' => 
      array (
        'Field' => 'category',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_system' => 
      array (
        'Field' => 'is_system',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'balance' => 
      array (
        'Field' => 'balance',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'code' => 
      array (
        'Key_name' => 'code',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'code',
        ),
      ),
      'idx_acc_type' => 
      array (
        'Key_name' => 'idx_acc_type',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'type',
        ),
      ),
    ),
  ),
  'acc_expenses' => 
  array (
    'name' => 'acc_expenses',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'voucher_no' => 
      array (
        'Field' => 'voucher_no',
        'Type' => 'varchar(30)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payee_id' => 
      array (
        'Field' => 'payee_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expense_account_id' => 
      array (
        'Field' => 'expense_account_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_account_id' => 
      array (
        'Field' => 'payment_account_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_date' => 
      array (
        'Field' => 'payment_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payee_name' => 
      array (
        'Field' => 'payee_name',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'enum(\'Cash\',\'Cheque\',\'TT\',\'Bank Transfer\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Cash',
        'Extra' => '',
      ),
      'cheque_no' => 
      array (
        'Field' => 'cheque_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tt_ref_no' => 
      array (
        'Field' => 'tt_ref_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reference_no' => 
      array (
        'Field' => 'reference_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Paid\',\'Pending\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Paid',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'voucher_no' => 
      array (
        'Key_name' => 'voucher_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'voucher_no',
        ),
      ),
      'idx_exp_account' => 
      array (
        'Key_name' => 'idx_exp_account',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'expense_account_id',
        ),
      ),
      'idx_exp_payment' => 
      array (
        'Key_name' => 'idx_exp_payment',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payment_account_id',
        ),
      ),
      'idx_exp_date' => 
      array (
        'Key_name' => 'idx_exp_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payment_date',
        ),
      ),
      'idx_exp_payee' => 
      array (
        'Key_name' => 'idx_exp_payee',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payee_id',
        ),
      ),
      'idx_exp_method' => 
      array (
        'Key_name' => 'idx_exp_method',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payment_method',
        ),
      ),
    ),
  ),
  'acc_fiscal_periods' => 
  array (
    'name' => 'acc_fiscal_periods',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'start_date' => 
      array (
        'Field' => 'start_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'end_date' => 
      array (
        'Field' => 'end_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_closed' => 
      array (
        'Field' => 'is_closed',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'closing_entry_id' => 
      array (
        'Field' => 'closing_entry_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'closed_at' => 
      array (
        'Field' => 'closed_at',
        'Type' => 'timestamp',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'closed_by' => 
      array (
        'Field' => 'closed_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'closing_entry_id' => 
      array (
        'Key_name' => 'closing_entry_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'closing_entry_id',
        ),
      ),
    ),
  ),
  'acc_journal_entries' => 
  array (
    'name' => 'acc_journal_entries',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'entry_date' => 
      array (
        'Field' => 'entry_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ref_type' => 
      array (
        'Field' => 'ref_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ref_id' => 
      array (
        'Field' => 'ref_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_aje_ref' => 
      array (
        'Key_name' => 'idx_aje_ref',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'ref_type',
          1 => 'ref_id',
        ),
      ),
      'idx_aje_date' => 
      array (
        'Key_name' => 'idx_aje_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'entry_date',
        ),
      ),
    ),
  ),
  'acc_journal_items' => 
  array (
    'name' => 'acc_journal_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'entry_id' => 
      array (
        'Field' => 'entry_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'account_id' => 
      array (
        'Field' => 'account_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'debit' => 
      array (
        'Field' => 'debit',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'credit' => 
      array (
        'Field' => 'credit',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'partner_type' => 
      array (
        'Field' => 'partner_type',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'partner_id' => 
      array (
        'Field' => 'partner_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reconciled_at' => 
      array (
        'Field' => 'reconciled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_aji_entry' => 
      array (
        'Key_name' => 'idx_aji_entry',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'entry_id',
        ),
      ),
      'idx_aji_account' => 
      array (
        'Key_name' => 'idx_aji_account',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'account_id',
        ),
      ),
      'idx_aji_partner' => 
      array (
        'Key_name' => 'idx_aji_partner',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'partner_id',
        ),
      ),
    ),
  ),
  'acc_mappings' => 
  array (
    'name' => 'acc_mappings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'map_key' => 
      array (
        'Field' => 'map_key',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'account_id' => 
      array (
        'Field' => 'account_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'label' => 
      array (
        'Field' => 'label',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category' => 
      array (
        'Field' => 'category',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'map_key' => 
      array (
        'Key_name' => 'map_key',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'map_key',
        ),
      ),
      'account_id' => 
      array (
        'Key_name' => 'account_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'account_id',
        ),
      ),
    ),
  ),
  'acc_payees' => 
  array (
    'name' => 'acc_payees',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'contact_no' => 
      array (
        'Field' => 'contact_no',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'Utility\',\'Service\',\'Other\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Other',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
      'idx_payee_name' => 
      array (
        'Key_name' => 'idx_payee_name',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'acc_purchase_return_items' => 
  array (
    'name' => 'acc_purchase_return_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'return_id' => 
      array (
        'Field' => 'return_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'return_id' => 
      array (
        'Key_name' => 'return_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'return_id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'acc_purchase_returns' => 
  array (
    'name' => 'acc_purchase_returns',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'grn_id' => 
      array (
        'Field' => 'grn_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'return_date' => 
      array (
        'Field' => 'return_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'grn_id' => 
      array (
        'Key_name' => 'grn_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'grn_id',
        ),
      ),
      'supplier_id' => 
      array (
        'Key_name' => 'supplier_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
    ),
  ),
  'acc_reconciliations' => 
  array (
    'name' => 'acc_reconciliations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'account_id' => 
      array (
        'Field' => 'account_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'statement_date' => 
      array (
        'Field' => 'statement_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'statement_balance' => 
      array (
        'Field' => 'statement_balance',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cleared_balance' => 
      array (
        'Field' => 'cleared_balance',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'difference' => 
      array (
        'Field' => 'difference',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_finalized' => 
      array (
        'Field' => 'is_finalized',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'account_id' => 
      array (
        'Key_name' => 'account_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'account_id',
        ),
      ),
    ),
  ),
  'acc_settings' => 
  array (
    'name' => 'acc_settings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'setting_key' => 
      array (
        'Field' => 'setting_key',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'setting_value' => 
      array (
        'Field' => 'setting_value',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category' => 
      array (
        'Field' => 'category',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'General',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'setting_key' => 
      array (
        'Key_name' => 'setting_key',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'setting_key',
        ),
      ),
    ),
  ),
  'acc_supplier_payment_allocations' => 
  array (
    'name' => 'acc_supplier_payment_allocations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'payment_id' => 
      array (
        'Field' => 'payment_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'grn_id' => 
      array (
        'Field' => 'grn_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'payment_id' => 
      array (
        'Key_name' => 'payment_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payment_id',
        ),
      ),
      'grn_id' => 
      array (
        'Key_name' => 'grn_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'grn_id',
        ),
      ),
    ),
  ),
  'acc_supplier_payments' => 
  array (
    'name' => 'acc_supplier_payments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'grn_id' => 
      array (
        'Field' => 'grn_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_date' => 
      array (
        'Field' => 'payment_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Bank Transfer',
        'Extra' => '',
      ),
      'reference_no' => 
      array (
        'Field' => 'reference_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Paid\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Paid',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'supplier_id' => 
      array (
        'Key_name' => 'supplier_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
      'grn_id' => 
      array (
        'Key_name' => 'grn_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'grn_id',
        ),
      ),
    ),
  ),
  'api_clients' => 
  array (
    'name' => 'api_clients',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'client_name' => 
      array (
        'Field' => 'client_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'domain' => 
      array (
        'Field' => 'domain',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'api_key' => 
      array (
        'Field' => 'api_key',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'api_key' => 
      array (
        'Key_name' => 'api_key',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'api_key',
        ),
      ),
    ),
  ),
  'attendance' => 
  array (
    'name' => 'attendance',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'date' => 
      array (
        'Field' => 'date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'clock_in' => 
      array (
        'Field' => 'clock_in',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'clock_out' => 
      array (
        'Field' => 'clock_out',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Present\',\'Absent\',\'Late\',\'Half-Day\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Present',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_emp_date' => 
      array (
        'Key_name' => 'uq_emp_date',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'employee_id',
          1 => 'date',
        ),
      ),
      'idx_att_date' => 
      array (
        'Key_name' => 'idx_att_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'date',
        ),
      ),
    ),
  ),
  'attribute_groups' => 
  array (
    'name' => 'attribute_groups',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'sort_order' => 
      array (
        'Field' => 'sort_order',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'attributes' => 
  array (
    'name' => 'attributes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'group_id' => 
      array (
        'Field' => 'group_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'text\',\'number\',\'boolean\',\'selection\',\'textarea\',\'para\',\'list\',\'icon-text\',\'badge\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'text',
        'Extra' => '',
      ),
      'sort_order' => 
      array (
        'Field' => 'sort_order',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'group_id' => 
      array (
        'Key_name' => 'group_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'group_id',
        ),
      ),
    ),
  ),
  'audit_logs' => 
  array (
    'name' => 'audit_logs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'bigint(20)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'user_id' => 
      array (
        'Field' => 'user_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'action' => 
      array (
        'Field' => 'action',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'entity' => 
      array (
        'Field' => 'entity',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'entity_id' => 
      array (
        'Field' => 'entity_id',
        'Type' => 'bigint(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'method' => 
      array (
        'Field' => 'method',
        'Type' => 'varchar(10)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'path' => 
      array (
        'Field' => 'path',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ip' => 
      array (
        'Field' => 'ip',
        'Type' => 'varchar(64)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'user_agent' => 
      array (
        'Field' => 'user_agent',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'details' => 
      array (
        'Field' => 'details',
        'Type' => 'longtext',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_audit_user' => 
      array (
        'Key_name' => 'idx_audit_user',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'user_id',
        ),
      ),
      'idx_audit_entity' => 
      array (
        'Key_name' => 'idx_audit_entity',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'entity',
          1 => 'entity_id',
        ),
      ),
      'idx_audit_action' => 
      array (
        'Key_name' => 'idx_audit_action',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'action',
        ),
      ),
      'idx_audit_created' => 
      array (
        'Key_name' => 'idx_audit_created',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'created_at',
        ),
      ),
      'idx_audit_location' => 
      array (
        'Key_name' => 'idx_audit_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'bank_branches' => 
  array (
    'name' => 'bank_branches',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'bank_id' => 
      array (
        'Field' => 'bank_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'branch_name' => 
      array (
        'Field' => 'branch_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'branch_code' => 
      array (
        'Field' => 'branch_code',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_bb_bank' => 
      array (
        'Key_name' => 'idx_bb_bank',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'bank_id',
        ),
      ),
    ),
  ),
  'banks' => 
  array (
    'name' => 'banks',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'code' => 
      array (
        'Field' => 'code',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'banquet_bookings' => 
  array (
    'name' => 'banquet_bookings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'booking_no' => 
      array (
        'Field' => 'booking_no',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'hall_id' => 
      array (
        'Field' => 'hall_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'menu_id' => 
      array (
        'Field' => 'menu_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'pax_count' => 
      array (
        'Field' => 'pax_count',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'booking_date' => 
      array (
        'Field' => 'booking_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'session' => 
      array (
        'Field' => 'session',
        'Type' => 'enum(\'Morning\',\'Evening\',\'FullDay\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'FullDay',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Confirmed\',\'Cancelled\',\'Completed\',\'Invoiced\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Confirmed',
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount_amount' => 
      array (
        'Field' => 'discount_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'total_cost' => 
      array (
        'Field' => 'total_cost',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'advance_paid' => 
      array (
        'Field' => 'advance_paid',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'booking_no' => 
      array (
        'Key_name' => 'booking_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'booking_no',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'hall_id' => 
      array (
        'Key_name' => 'hall_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'hall_id',
        ),
      ),
    ),
  ),
  'banquet_event_assignments' => 
  array (
    'name' => 'banquet_event_assignments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'booking_id' => 
      array (
        'Field' => 'booking_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'resource_id' => 
      array (
        'Field' => 'resource_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'vendor_id' => 
      array (
        'Field' => 'vendor_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty' => 
      array (
        'Field' => 'qty',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Confirmed\',\'Completed\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_bea_booking' => 
      array (
        'Key_name' => 'idx_bea_booking',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'booking_id',
        ),
      ),
      'idx_bea_resource' => 
      array (
        'Key_name' => 'idx_bea_resource',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'resource_id',
        ),
      ),
      'idx_bea_vendor' => 
      array (
        'Key_name' => 'idx_bea_vendor',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'vendor_id',
        ),
      ),
    ),
  ),
  'banquet_halls' => 
  array (
    'name' => 'banquet_halls',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'capacity' => 
      array (
        'Field' => 'capacity',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'price_per_session' => 
      array (
        'Field' => 'price_per_session',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Available\',\'Maintenance\',\'Inactive\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Available',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'banquet_menu_items' => 
  array (
    'name' => 'banquet_menu_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'menu_id' => 
      array (
        'Field' => 'menu_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category' => 
      array (
        'Field' => 'category',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty' => 
      array (
        'Field' => 'qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1.000',
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'menu_id' => 
      array (
        'Key_name' => 'menu_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'menu_id',
        ),
      ),
    ),
  ),
  'banquet_menus' => 
  array (
    'name' => 'banquet_menus',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'price_per_pax' => 
      array (
        'Field' => 'price_per_pax',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'cost_price' => 
      array (
        'Field' => 'cost_price',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'banquet_resources' => 
  array (
    'name' => 'banquet_resources',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'resource_type' => 
      array (
        'Field' => 'resource_type',
        'Type' => 'enum(\'Internal\',\'External\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Internal',
        'Extra' => '',
      ),
      'base_price' => 
      array (
        'Field' => 'base_price',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'selling_price' => 
      array (
        'Field' => 'selling_price',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'default_supplier_id' => 
      array (
        'Field' => 'default_supplier_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'fk_br_supplier' => 
      array (
        'Key_name' => 'fk_br_supplier',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'default_supplier_id',
        ),
      ),
    ),
  ),
  'banquet_staff_assignments' => 
  array (
    'name' => 'banquet_staff_assignments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'booking_id' => 
      array (
        'Field' => 'booking_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'role' => 
      array (
        'Field' => 'role',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_bsa_booking' => 
      array (
        'Key_name' => 'idx_bsa_booking',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'booking_id',
        ),
      ),
      'idx_bsa_employee' => 
      array (
        'Key_name' => 'idx_bsa_employee',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'employee_id',
        ),
      ),
    ),
  ),
  'brands' => 
  array (
    'name' => 'brands',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'checklist_items' => 
  array (
    'name' => 'checklist_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'completed' => 
      array (
        'Field' => 'completed',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_id' => 
      array (
        'Key_name' => 'order_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
    ),
  ),
  'checklist_templates' => 
  array (
    'name' => 'checklist_templates',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'standard_mileage' => 
      array (
        'Field' => 'standard_mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'extended_description' => 
      array (
        'Field' => 'extended_description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'cheque_inventory' => 
  array (
    'name' => 'cheque_inventory',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'receipt_id' => 
      array (
        'Field' => 'receipt_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cheque_no_last6' => 
      array (
        'Field' => 'cheque_no_last6',
        'Type' => 'char(6)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bank_name' => 
      array (
        'Field' => 'bank_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '',
        'Extra' => '',
      ),
      'branch_name' => 
      array (
        'Field' => 'branch_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '',
        'Extra' => '',
      ),
      'cheque_date' => 
      array (
        'Field' => 'cheque_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payee_name' => 
      array (
        'Field' => 'payee_name',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '',
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Deposited\',\'Cleared\',\'Bounced\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'cleared_date' => 
      array (
        'Field' => 'cleared_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_ci_receipt' => 
      array (
        'Key_name' => 'idx_ci_receipt',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'receipt_id',
        ),
      ),
      'idx_ci_status' => 
      array (
        'Key_name' => 'idx_ci_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
    ),
  ),
  'cities' => 
  array (
    'name' => 'cities',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'postal_code' => 
      array (
        'Field' => 'postal_code',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'district_id' => 
      array (
        'Field' => 'district_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'district_id' => 
      array (
        'Key_name' => 'district_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'district_id',
        ),
      ),
    ),
  ),
  'collections' => 
  array (
    'name' => 'collections',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'show_in_public' => 
      array (
        'Field' => 'show_in_public',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_collections_name' => 
      array (
        'Key_name' => 'uq_collections_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'company' => 
  array (
    'name' => 'company',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_no' => 
      array (
        'Field' => 'tax_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_label' => 
      array (
        'Field' => 'tax_label',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_ids_json' => 
      array (
        'Field' => 'tax_ids_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'logo_filename' => 
      array (
        'Field' => 'logo_filename',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'company_taxes' => 
  array (
    'name' => 'company_taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'company_id' => 
      array (
        'Field' => 'company_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'tax_id' => 
      array (
        'Field' => 'tax_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'tax_id' => 
      array (
        'Key_name' => 'tax_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'tax_id',
        ),
      ),
    ),
  ),
  'coupon_usage' => 
  array (
    'name' => 'coupon_usage',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'coupon_id' => 
      array (
        'Field' => 'coupon_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'discount_amount' => 
      array (
        'Field' => 'discount_amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'used_at' => 
      array (
        'Field' => 'used_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'coupon_id' => 
      array (
        'Key_name' => 'coupon_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'coupon_id',
        ),
      ),
    ),
  ),
  'coupons' => 
  array (
    'name' => 'coupons',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'code' => 
      array (
        'Field' => 'code',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'discount_type' => 
      array (
        'Field' => 'discount_type',
        'Type' => 'enum(\'Percentage\',\'FixedAmount\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Percentage',
        'Extra' => '',
      ),
      'discount_value' => 
      array (
        'Field' => 'discount_value',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'min_order_amount' => 
      array (
        'Field' => 'min_order_amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_discount_amount' => 
      array (
        'Field' => 'max_discount_amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'start_date' => 
      array (
        'Field' => 'start_date',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'end_date' => 
      array (
        'Field' => 'end_date',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'max_uses' => 
      array (
        'Field' => 'max_uses',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'used_count' => 
      array (
        'Field' => 'used_count',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'user_limit' => 
      array (
        'Field' => 'user_limit',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'code' => 
      array (
        'Key_name' => 'code',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'code',
        ),
      ),
    ),
  ),
  'crm_inquiries' => 
  array (
    'name' => 'crm_inquiries',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'inquiry_number' => 
      array (
        'Field' => 'inquiry_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_name' => 
      array (
        'Field' => 'customer_name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'source' => 
      array (
        'Field' => 'source',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Direct',
        'Extra' => '',
      ),
      'inquiry_type' => 
      array (
        'Field' => 'inquiry_type',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => 'General',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'New\',\'Contacted\',\'Qualified\',\'Converted\',\'Lost\')',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => 'New',
        'Extra' => '',
      ),
      'assigned_to' => 
      array (
        'Field' => 'assigned_to',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'requirements' => 
      array (
        'Field' => 'requirements',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'converted_to_type' => 
      array (
        'Field' => 'converted_to_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'converted_to_id' => 
      array (
        'Field' => 'converted_to_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'inquiry_number' => 
      array (
        'Key_name' => 'inquiry_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'inquiry_number',
        ),
      ),
      'idx_inquiry_customer' => 
      array (
        'Key_name' => 'idx_inquiry_customer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'idx_inquiry_status' => 
      array (
        'Key_name' => 'idx_inquiry_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'idx_inquiry_type' => 
      array (
        'Key_name' => 'idx_inquiry_type',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'inquiry_type',
        ),
      ),
      'idx_inquiry_assigned' => 
      array (
        'Key_name' => 'idx_inquiry_assigned',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'assigned_to',
        ),
      ),
      'idx_inq_created' => 
      array (
        'Key_name' => 'idx_inq_created',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'created_at',
        ),
      ),
    ),
  ),
  'crm_inquiry_items' => 
  array (
    'name' => 'crm_inquiry_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'inquiry_id' => 
      array (
        'Field' => 'inquiry_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_inquiry_item' => 
      array (
        'Key_name' => 'idx_inquiry_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'inquiry_id',
        ),
      ),
      'idx_inqi_item' => 
      array (
        'Key_name' => 'idx_inqi_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_id',
        ),
      ),
    ),
  ),
  'crm_inquiry_logs' => 
  array (
    'name' => 'crm_inquiry_logs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'inquiry_id' => 
      array (
        'Field' => 'inquiry_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'action' => 
      array (
        'Field' => 'action',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_inquiry_log_inquiry' => 
      array (
        'Key_name' => 'idx_inquiry_log_inquiry',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'inquiry_id',
        ),
      ),
    ),
  ),
  'customer_segments' => 
  array (
    'name' => 'customer_segments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'customer_visits' => 
  array (
    'name' => 'customer_visits',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'user_id' => 
      array (
        'Field' => 'user_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'visit_type' => 
      array (
        'Field' => 'visit_type',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'latitude' => 
      array (
        'Field' => 'latitude',
        'Type' => 'decimal(10,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'longitude' => 
      array (
        'Field' => 'longitude',
        'Type' => 'decimal(11,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_cv_customer' => 
      array (
        'Key_name' => 'idx_cv_customer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'idx_cv_user' => 
      array (
        'Key_name' => 'idx_cv_user',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'user_id',
        ),
      ),
    ),
  ),
  'customers' => 
  array (
    'name' => 'customers',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'password' => 
      array (
        'Field' => 'password',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_portal_active' => 
      array (
        'Field' => 'is_portal_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'last_login_at' => 
      array (
        'Field' => 'last_login_at',
        'Type' => 'timestamp',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'city' => 
      array (
        'Field' => 'city',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'postal_code' => 
      array (
        'Field' => 'postal_code',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'nic' => 
      array (
        'Field' => 'nic',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'tax_number' => 
      array (
        'Field' => 'tax_number',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_type' => 
      array (
        'Field' => 'order_type',
        'Type' => 'enum(\'Internal\',\'External\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'External',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'credit_limit' => 
      array (
        'Field' => 'credit_limit',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'credit_days' => 
      array (
        'Field' => 'credit_days',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'district_id' => 
      array (
        'Field' => 'district_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'city_id' => 
      array (
        'Field' => 'city_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_unsubscribed' => 
      array (
        'Field' => 'is_unsubscribed',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_ecommerce_user' => 
      array (
        'Field' => 'is_ecommerce_user',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'last_login' => 
      array (
        'Field' => 'last_login',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'latitude' => 
      array (
        'Field' => 'latitude',
        'Type' => 'decimal(10,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'longitude' => 
      array (
        'Field' => 'longitude',
        'Type' => 'decimal(11,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'photo_url' => 
      array (
        'Field' => 'photo_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qr_code_hash' => 
      array (
        'Field' => 'qr_code_hash',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'route_id' => 
      array (
        'Field' => 'route_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_customers_name_phone' => 
      array (
        'Key_name' => 'uq_customers_name_phone',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
          1 => 'phone',
        ),
      ),
      'fk_customers_route' => 
      array (
        'Key_name' => 'fk_customers_route',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'route_id',
        ),
      ),
    ),
  ),
  'departments' => 
  array (
    'name' => 'departments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_departments_loc_name' => 
      array (
        'Key_name' => 'uq_departments_loc_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'location_id',
          1 => 'name',
        ),
      ),
    ),
  ),
  'device_tracking_logs' => 
  array (
    'name' => 'device_tracking_logs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'user_id' => 
      array (
        'Field' => 'user_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'latitude' => 
      array (
        'Field' => 'latitude',
        'Type' => 'decimal(10,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'longitude' => 
      array (
        'Field' => 'longitude',
        'Type' => 'decimal(11,8)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'app_time' => 
      array (
        'Field' => 'app_time',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'districts' => 
  array (
    'name' => 'districts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_zone_id' => 
      array (
        'Field' => 'shipping_zone_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'shipping_zone_id' => 
      array (
        'Key_name' => 'shipping_zone_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'shipping_zone_id',
        ),
      ),
    ),
  ),
  'document_sequences' => 
  array (
    'name' => 'document_sequences',
    'columns' => 
    array (
      'doc_type' => 
      array (
        'Field' => 'doc_type',
        'Type' => 'varchar(30)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'prefix' => 
      array (
        'Field' => 'prefix',
        'Type' => 'varchar(10)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'next_number' => 
      array (
        'Field' => 'next_number',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'padding' => 
      array (
        'Field' => 'padding',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '6',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'doc_type',
        ),
      ),
    ),
  ),
  'email_campaigns' => 
  array (
    'name' => 'email_campaigns',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subject' => 
      array (
        'Field' => 'subject',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'content' => 
      array (
        'Field' => 'content',
        'Type' => 'longtext',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'target_segment' => 
      array (
        'Field' => 'target_segment',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'all',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Queued\',\'Processing\',\'Sent\',\'Failed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'sent_at' => 
      array (
        'Field' => 'sent_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'email_logs' => 
  array (
    'name' => 'email_logs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'campaign_id' => 
      array (
        'Field' => 'campaign_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'recipient' => 
      array (
        'Field' => 'recipient',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subject' => 
      array (
        'Field' => 'subject',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Success\',\'Failed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Success',
        'Extra' => '',
      ),
      'error_message' => 
      array (
        'Field' => 'error_message',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'sent_at' => 
      array (
        'Field' => 'sent_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'campaign_id' => 
      array (
        'Key_name' => 'campaign_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'campaign_id',
        ),
      ),
    ),
  ),
  'email_queue' => 
  array (
    'name' => 'email_queue',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'campaign_id' => 
      array (
        'Field' => 'campaign_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'recipient_email' => 
      array (
        'Field' => 'recipient_email',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'recipient_name' => 
      array (
        'Field' => 'recipient_name',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subject' => 
      array (
        'Field' => 'subject',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'content' => 
      array (
        'Field' => 'content',
        'Type' => 'longtext',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Processing\',\'Sent\',\'Failed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'error_message' => 
      array (
        'Field' => 'error_message',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'attempts' => 
      array (
        'Field' => 'attempts',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'processed_at' => 
      array (
        'Field' => 'processed_at',
        'Type' => 'timestamp',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'campaign_id' => 
      array (
        'Key_name' => 'campaign_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'campaign_id',
        ),
      ),
    ),
  ),
  'email_templates' => 
  array (
    'name' => 'email_templates',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subject' => 
      array (
        'Field' => 'subject',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'content' => 
      array (
        'Field' => 'content',
        'Type' => 'longtext',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'employees' => 
  array (
    'name' => 'employees',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_code' => 
      array (
        'Field' => 'employee_code',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'user_id' => 
      array (
        'Field' => 'user_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'first_name' => 
      array (
        'Field' => 'first_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'last_name' => 
      array (
        'Field' => 'last_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'nic' => 
      array (
        'Field' => 'nic',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'dob' => 
      array (
        'Field' => 'dob',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'gender' => 
      array (
        'Field' => 'gender',
        'Type' => 'enum(\'Male\',\'Female\',\'Other\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bank_account_no' => 
      array (
        'Field' => 'bank_account_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bank_name' => 
      array (
        'Field' => 'bank_name',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category_id' => 
      array (
        'Field' => 'category_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'department_id' => 
      array (
        'Field' => 'department_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'designation' => 
      array (
        'Field' => 'designation',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'joined_date' => 
      array (
        'Field' => 'joined_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'basic_salary' => 
      array (
        'Field' => 'basic_salary',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Active\',\'Inactive\',\'Terminated\',\'Resigned\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Active',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'nationality' => 
      array (
        'Field' => 'nationality',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'religion' => 
      array (
        'Field' => 'religion',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'marital_status' => 
      array (
        'Field' => 'marital_status',
        'Type' => 'enum(\'Single\',\'Married\',\'Divorced\',\'Widowed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'blood_group' => 
      array (
        'Field' => 'blood_group',
        'Type' => 'varchar(5)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'emergency_contact_name' => 
      array (
        'Field' => 'emergency_contact_name',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'emergency_contact_phone' => 
      array (
        'Field' => 'emergency_contact_phone',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'emergency_contact_relationship' => 
      array (
        'Field' => 'emergency_contact_relationship',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'passport_no' => 
      array (
        'Field' => 'passport_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'epf_no' => 
      array (
        'Field' => 'epf_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'etf_no' => 
      array (
        'Field' => 'etf_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'facebook_url' => 
      array (
        'Field' => 'facebook_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'linkedin_url' => 
      array (
        'Field' => 'linkedin_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'twitter_url' => 
      array (
        'Field' => 'twitter_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'instagram_url' => 
      array (
        'Field' => 'instagram_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'avatar_url' => 
      array (
        'Field' => 'avatar_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'employee_code' => 
      array (
        'Key_name' => 'employee_code',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'employee_code',
        ),
      ),
      'nic' => 
      array (
        'Key_name' => 'nic',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'nic',
        ),
      ),
      'idx_emp_dept' => 
      array (
        'Key_name' => 'idx_emp_dept',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'department_id',
        ),
      ),
      'idx_emp_user' => 
      array (
        'Key_name' => 'idx_emp_user',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'user_id',
        ),
      ),
      'idx_emp_cat' => 
      array (
        'Key_name' => 'idx_emp_cat',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'category_id',
        ),
      ),
    ),
  ),
  'export_container_types' => 
  array (
    'name' => 'export_container_types',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'max_cbm_capacity' => 
      array (
        'Field' => 'max_cbm_capacity',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_weight_capacity_kg' => 
      array (
        'Field' => 'max_weight_capacity_kg',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_standard_pallets' => 
      array (
        'Field' => 'max_standard_pallets',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'export_packaging_types' => 
  array (
    'name' => 'export_packaging_types',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'Carton\',\'Bag\',\'Drum\',\'Crate\',\'Other\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Carton',
        'Extra' => '',
      ),
      'length_cm' => 
      array (
        'Field' => 'length_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'width_cm' => 
      array (
        'Field' => 'width_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'height_cm' => 
      array (
        'Field' => 'height_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'cbm' => 
      array (
        'Field' => 'cbm',
        'Type' => 'decimal(10,4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.0000',
        'Extra' => '',
      ),
      'tare_weight_kg' => 
      array (
        'Field' => 'tare_weight_kg',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_weight_capacity_kg' => 
      array (
        'Field' => 'max_weight_capacity_kg',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'export_pallet_types' => 
  array (
    'name' => 'export_pallet_types',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'length_cm' => 
      array (
        'Field' => 'length_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'width_cm' => 
      array (
        'Field' => 'width_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_load_height_cm' => 
      array (
        'Field' => 'max_load_height_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tare_weight_kg' => 
      array (
        'Field' => 'tare_weight_kg',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_weight_capacity_kg' => 
      array (
        'Field' => 'max_weight_capacity_kg',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'goods_receive_notes' => 
  array (
    'name' => 'goods_receive_notes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'grn_number' => 
      array (
        'Field' => 'grn_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'purchase_order_id' => 
      array (
        'Field' => 'purchase_order_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'received_at' => 
      array (
        'Field' => 'received_at',
        'Type' => 'datetime',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Received\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Received',
        'Extra' => '',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_grn_number' => 
      array (
        'Key_name' => 'uq_grn_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'grn_number',
        ),
      ),
      'idx_grn_supplier' => 
      array (
        'Key_name' => 'idx_grn_supplier',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
      'idx_grn_po' => 
      array (
        'Key_name' => 'idx_grn_po',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'purchase_order_id',
        ),
      ),
      'idx_grn_location' => 
      array (
        'Key_name' => 'idx_grn_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_grn_date' => 
      array (
        'Key_name' => 'idx_grn_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'received_at',
        ),
      ),
    ),
  ),
  'grn_items' => 
  array (
    'name' => 'grn_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'grn_id' => 
      array (
        'Field' => 'grn_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_received' => 
      array (
        'Field' => 'qty_received',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_number' => 
      array (
        'Field' => 'batch_number',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'mfg_date' => 
      array (
        'Field' => 'mfg_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expiry_date' => 
      array (
        'Field' => 'expiry_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_grni_grn' => 
      array (
        'Key_name' => 'idx_grni_grn',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'grn_id',
        ),
      ),
      'idx_grni_part' => 
      array (
        'Key_name' => 'idx_grni_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_grni_item' => 
      array (
        'Key_name' => 'idx_grni_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'hotel_reservation_items' => 
  array (
    'name' => 'hotel_reservation_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'reservation_id' => 
      array (
        'Field' => 'reservation_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'total_price' => 
      array (
        'Field' => 'total_price',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'source' => 
      array (
        'Field' => 'source',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'FrontOffice',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'reservation_id' => 
      array (
        'Key_name' => 'reservation_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'reservation_id',
        ),
      ),
    ),
  ),
  'hotel_reservations' => 
  array (
    'name' => 'hotel_reservations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'reservation_no' => 
      array (
        'Field' => 'reservation_no',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'room_id' => 
      array (
        'Field' => 'room_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'check_in' => 
      array (
        'Field' => 'check_in',
        'Type' => 'datetime',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'check_out' => 
      array (
        'Field' => 'check_out',
        'Type' => 'datetime',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'adults' => 
      array (
        'Field' => 'adults',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'children' => 
      array (
        'Field' => 'children',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Confirmed\',\'CheckedIn\',\'CheckedOut\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Confirmed',
        'Extra' => '',
      ),
      'meal_plan' => 
      array (
        'Field' => 'meal_plan',
        'Type' => 'enum(\'RO\',\'BB\',\'HB\',\'FB\',\'AI\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'BB',
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'paid_amount' => 
      array (
        'Field' => 'paid_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'reservation_no' => 
      array (
        'Key_name' => 'reservation_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'reservation_no',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'room_id' => 
      array (
        'Key_name' => 'room_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'room_id',
        ),
      ),
    ),
  ),
  'hotel_room_rates' => 
  array (
    'name' => 'hotel_room_rates',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'type_id' => 
      array (
        'Field' => 'type_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'meal_plan' => 
      array (
        'Field' => 'meal_plan',
        'Type' => 'enum(\'RO\',\'BB\',\'HB\',\'FB\',\'AI\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rate' => 
      array (
        'Field' => 'rate',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'type_meal' => 
      array (
        'Key_name' => 'type_meal',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'type_id',
          1 => 'meal_plan',
        ),
      ),
    ),
  ),
  'hotel_room_types' => 
  array (
    'name' => 'hotel_room_types',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'base_rate' => 
      array (
        'Field' => 'base_rate',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'max_occupancy' => 
      array (
        'Field' => 'max_occupancy',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '2',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'hotel_rooms' => 
  array (
    'name' => 'hotel_rooms',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'room_number' => 
      array (
        'Field' => 'room_number',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type_id' => 
      array (
        'Field' => 'type_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Available\',\'Occupied\',\'Dirty\',\'Maintenance\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Available',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'room_number' => 
      array (
        'Key_name' => 'room_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'room_number',
        ),
      ),
      'type_id' => 
      array (
        'Key_name' => 'type_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'type_id',
        ),
      ),
    ),
  ),
  'hr_categories' => 
  array (
    'name' => 'hr_categories',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'prefix' => 
      array (
        'Field' => 'prefix',
        'Type' => 'varchar(10)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
      'prefix' => 
      array (
        'Key_name' => 'prefix',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'prefix',
        ),
      ),
    ),
  ),
  'hr_departments' => 
  array (
    'name' => 'hr_departments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'prefix' => 
      array (
        'Field' => 'prefix',
        'Type' => 'varchar(10)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
      'prefix' => 
      array (
        'Key_name' => 'prefix',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'prefix',
        ),
      ),
    ),
  ),
  'hr_employee_documents' => 
  array (
    'name' => 'hr_employee_documents',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'title' => 
      array (
        'Field' => 'title',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'file_path' => 
      array (
        'Field' => 'file_path',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'file_name' => 
      array (
        'Field' => 'file_name',
        'Type' => 'varchar(150)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'file_type' => 
      array (
        'Field' => 'file_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_hed_emp' => 
      array (
        'Key_name' => 'idx_hed_emp',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'employee_id',
        ),
      ),
    ),
  ),
  'hr_salary_items' => 
  array (
    'name' => 'hr_salary_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'Allowance\',\'Deduction\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_recurring' => 
      array (
        'Field' => 'is_recurring',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_hsi_emp' => 
      array (
        'Key_name' => 'idx_hsi_emp',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'employee_id',
        ),
      ),
    ),
  ),
  'hr_salary_template_items' => 
  array (
    'name' => 'hr_salary_template_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'template_id' => 
      array (
        'Field' => 'template_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'Allowance\',\'Deduction\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_hsti_temp' => 
      array (
        'Key_name' => 'idx_hsti_temp',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'template_id',
        ),
      ),
    ),
  ),
  'hr_salary_templates' => 
  array (
    'name' => 'hr_salary_templates',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'hr_settings' => 
  array (
    'name' => 'hr_settings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'setting_key' => 
      array (
        'Field' => 'setting_key',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'setting_value' => 
      array (
        'Field' => 'setting_value',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'setting_key' => 
      array (
        'Key_name' => 'setting_key',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'setting_key',
        ),
      ),
    ),
  ),
  'inventory_batches' => 
  array (
    'name' => 'inventory_batches',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'batch_number' => 
      array (
        'Field' => 'batch_number',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'mfg_date' => 
      array (
        'Field' => 'mfg_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expiry_date' => 
      array (
        'Field' => 'expiry_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity_received' => 
      array (
        'Field' => 'quantity_received',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'quantity_on_hand' => 
      array (
        'Field' => 'quantity_on_hand',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(15,4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'grn_id' => 
      array (
        'Field' => 'grn_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_exhausted' => 
      array (
        'Field' => 'is_exhausted',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_ib_part' => 
      array (
        'Key_name' => 'idx_ib_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_ib_location' => 
      array (
        'Key_name' => 'idx_ib_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_ib_mfg' => 
      array (
        'Key_name' => 'idx_ib_mfg',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'mfg_date',
        ),
      ),
      'idx_ib_expiry' => 
      array (
        'Key_name' => 'idx_ib_expiry',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'expiry_date',
        ),
      ),
      'idx_ib_exhausted' => 
      array (
        'Key_name' => 'idx_ib_exhausted',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'is_exhausted',
        ),
      ),
      'idx_ib_grn' => 
      array (
        'Key_name' => 'idx_ib_grn',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'grn_id',
        ),
      ),
    ),
  ),
  'invoice_items' => 
  array (
    'name' => 'invoice_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'enum(\'Part\',\'Labor\',\'Service\',\'Other\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'cost_price' => 
      array (
        'Field' => 'cost_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount' => 
      array (
        'Field' => 'discount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'invoice_id' => 
      array (
        'Key_name' => 'invoice_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
      'idx_ii_item' => 
      array (
        'Key_name' => 'idx_ii_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_id',
        ),
      ),
    ),
  ),
  'invoice_payments' => 
  array (
    'name' => 'invoice_payments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_date' => 
      array (
        'Field' => 'payment_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Cash',
        'Extra' => '',
      ),
      'reference_no' => 
      array (
        'Field' => 'reference_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'invoice_id' => 
      array (
        'Key_name' => 'invoice_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
    ),
  ),
  'invoice_taxes' => 
  array (
    'name' => 'invoice_taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_name' => 
      array (
        'Field' => 'tax_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_code' => 
      array (
        'Field' => 'tax_code',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rate_percent' => 
      array (
        'Field' => 'rate_percent',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'invoice_id' => 
      array (
        'Key_name' => 'invoice_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
    ),
  ),
  'invoices' => 
  array (
    'name' => 'invoices',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'invoice_no' => 
      array (
        'Field' => 'invoice_no',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'online_order_id' => 
      array (
        'Field' => 'online_order_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reservation_id' => 
      array (
        'Field' => 'reservation_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'banquet_booking_id' => 
      array (
        'Field' => 'banquet_booking_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'recurring_template_id' => 
      array (
        'Field' => 'recurring_template_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'billing_address' => 
      array (
        'Field' => 'billing_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_address' => 
      array (
        'Field' => 'shipping_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'issue_date' => 
      array (
        'Field' => 'issue_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'due_date' => 
      array (
        'Field' => 'due_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount_total' => 
      array (
        'Field' => 'discount_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'grand_total' => 
      array (
        'Field' => 'grand_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_fee' => 
      array (
        'Field' => 'shipping_fee',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_provider_id' => 
      array (
        'Field' => 'shipping_provider_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_international' => 
      array (
        'Field' => 'is_international',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'shipping_country' => 
      array (
        'Field' => 'shipping_country',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_type' => 
      array (
        'Field' => 'order_type',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'retail',
        'Extra' => '',
      ),
      'table_id' => 
      array (
        'Field' => 'table_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'steward_id' => 
      array (
        'Field' => 'steward_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'paid_amount' => 
      array (
        'Field' => 'paid_amount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Unpaid\',\'Partial\',\'Paid\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => 'Unpaid',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'applied_promotion_id' => 
      array (
        'Field' => 'applied_promotion_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'applied_promotion_name' => 
      array (
        'Field' => 'applied_promotion_name',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'invoice_no' => 
      array (
        'Key_name' => 'invoice_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'invoice_no',
        ),
      ),
      'order_id' => 
      array (
        'Key_name' => 'order_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'idx_inv_location' => 
      array (
        'Key_name' => 'idx_inv_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_inv_date' => 
      array (
        'Key_name' => 'idx_inv_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'issue_date',
        ),
      ),
      'idx_inv_status' => 
      array (
        'Key_name' => 'idx_inv_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'idx_inv_created' => 
      array (
        'Key_name' => 'idx_inv_created',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'created_at',
        ),
      ),
    ),
  ),
  'item_categories' => 
  array (
    'name' => 'item_categories',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_item_cats_name' => 
      array (
        'Key_name' => 'uq_item_cats_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'item_departments' => 
  array (
    'name' => 'item_departments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'section_id' => 
      array (
        'Field' => 'section_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_item_dept_name' => 
      array (
        'Key_name' => 'uq_item_dept_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'section_id',
          1 => 'name',
        ),
      ),
      'idx_item_dept_section' => 
      array (
        'Key_name' => 'idx_item_dept_section',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'section_id',
        ),
      ),
    ),
  ),
  'item_sections' => 
  array (
    'name' => 'item_sections',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_item_sections_name' => 
      array (
        'Key_name' => 'uq_item_sections_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'leave_requests' => 
  array (
    'name' => 'leave_requests',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'leave_type_id' => 
      array (
        'Field' => 'leave_type_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'start_date' => 
      array (
        'Field' => 'start_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'end_date' => 
      array (
        'Field' => 'end_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'total_days' => 
      array (
        'Field' => 'total_days',
        'Type' => 'decimal(5,1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Approved\',\'Rejected\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'approved_by' => 
      array (
        'Field' => 'approved_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_at' => 
      array (
        'Field' => 'approved_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_lr_emp' => 
      array (
        'Key_name' => 'idx_lr_emp',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'employee_id',
        ),
      ),
      'idx_lr_status' => 
      array (
        'Key_name' => 'idx_lr_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'leave_type_id' => 
      array (
        'Key_name' => 'leave_type_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'leave_type_id',
        ),
      ),
    ),
  ),
  'leave_types' => 
  array (
    'name' => 'leave_types',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'allocation_per_year' => 
      array (
        'Field' => 'allocation_per_year',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'locations' => 
  array (
    'name' => 'locations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'city' => 
      array (
        'Field' => 'city',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'postal_code' => 
      array (
        'Field' => 'postal_code',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'district' => 
      array (
        'Field' => 'district',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_city_postal' => 
      array (
        'Key_name' => 'uq_city_postal',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'city',
          1 => 'postal_code',
        ),
      ),
    ),
  ),
  'logistics_categories' => 
  array (
    'name' => 'logistics_categories',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'logistics_factors' => 
  array (
    'name' => 'logistics_factors',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'General',
        'Extra' => '',
      ),
      'absorption_method' => 
      array (
        'Field' => 'absorption_method',
        'Type' => 'enum(\'Value\',\'Quantity\',\'Weight\',\'Volume\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Value',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'marketing_media' => 
  array (
    'name' => 'marketing_media',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'filename' => 
      array (
        'Field' => 'filename',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'url' => 
      array (
        'Field' => 'url',
        'Type' => 'varchar(500)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'online_order_items' => 
  array (
    'name' => 'online_order_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(15,4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.0000',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount' => 
      array (
        'Field' => 'discount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_id' => 
      array (
        'Key_name' => 'order_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
      'item_id' => 
      array (
        'Key_name' => 'item_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_id',
        ),
      ),
    ),
  ),
  'online_orders' => 
  array (
    'name' => 'online_orders',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_no' => 
      array (
        'Field' => 'order_no',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_details_json' => 
      array (
        'Field' => 'customer_details_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_address' => 
      array (
        'Field' => 'shipping_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'billing_address' => 
      array (
        'Field' => 'billing_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal_amount' => 
      array (
        'Field' => 'subtotal_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_details_json' => 
      array (
        'Field' => 'tax_details_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_fee' => 
      array (
        'Field' => 'shipping_fee',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_zone_id' => 
      array (
        'Field' => 'shipping_zone_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'district_id' => 
      array (
        'Field' => 'district_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'COD',
        'Extra' => '',
      ),
      'payment_status' => 
      array (
        'Field' => 'payment_status',
        'Type' => 'enum(\'Pending\',\'Paid\',\'Failed\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'order_status' => 
      array (
        'Field' => 'order_status',
        'Type' => 'enum(\'Pending\',\'Processing\',\'Shipped\',\'Completed\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'shipping_carrier' => 
      array (
        'Field' => 'shipping_carrier',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tracking_no' => 
      array (
        'Field' => 'tracking_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payhere_id' => 
      array (
        'Field' => 'payhere_id',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_slip' => 
      array (
        'Field' => 'payment_slip',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'coupon_code' => 
      array (
        'Field' => 'coupon_code',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'coupon_discount' => 
      array (
        'Field' => 'coupon_discount',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_no' => 
      array (
        'Key_name' => 'order_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'order_no',
        ),
      ),
      'location_id' => 
      array (
        'Key_name' => 'location_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'invoice_id' => 
      array (
        'Key_name' => 'invoice_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
      'shipping_zone_id' => 
      array (
        'Key_name' => 'shipping_zone_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'shipping_zone_id',
        ),
      ),
      'district_id' => 
      array (
        'Key_name' => 'district_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'district_id',
        ),
      ),
    ),
  ),
  'order_parts' => 
  array (
    'name' => 'order_parts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_id' => 
      array (
        'Field' => 'batch_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_order_parts_order' => 
      array (
        'Key_name' => 'idx_order_parts_order',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
      'idx_order_parts_part' => 
      array (
        'Key_name' => 'idx_order_parts_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'part_attribute_groups' => 
  array (
    'name' => 'part_attribute_groups',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'group_id' => 
      array (
        'Field' => 'group_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_part_group' => 
      array (
        'Key_name' => 'uq_part_group',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'part_id',
          1 => 'group_id',
        ),
      ),
      'group_id' => 
      array (
        'Key_name' => 'group_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'group_id',
        ),
      ),
    ),
  ),
  'part_attribute_values' => 
  array (
    'name' => 'part_attribute_values',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'attribute_id' => 
      array (
        'Field' => 'attribute_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'value' => 
      array (
        'Field' => 'value',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_part_attr' => 
      array (
        'Key_name' => 'uq_part_attr',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'part_id',
          1 => 'attribute_id',
        ),
      ),
      'attribute_id' => 
      array (
        'Key_name' => 'attribute_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'attribute_id',
        ),
      ),
    ),
  ),
  'part_images' => 
  array (
    'name' => 'part_images',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'filename' => 
      array (
        'Field' => 'filename',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'label' => 
      array (
        'Field' => 'label',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'sort_order' => 
      array (
        'Field' => 'sort_order',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'part_suppliers' => 
  array (
    'name' => 'part_suppliers',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_part_sup' => 
      array (
        'Key_name' => 'uq_part_sup',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'part_id',
          1 => 'supplier_id',
        ),
      ),
      'idx_part_sup_part' => 
      array (
        'Key_name' => 'idx_part_sup_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_part_sup_supplier' => 
      array (
        'Key_name' => 'idx_part_sup_supplier',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
    ),
  ),
  'parts' => 
  array (
    'name' => 'parts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_name' => 
      array (
        'Field' => 'part_name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'stock_quantity' => 
      array (
        'Field' => 'stock_quantity',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'price' => 
      array (
        'Field' => 'price',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'sku' => 
      array (
        'Field' => 'sku',
        'Type' => 'varchar(64)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit' => 
      array (
        'Field' => 'unit',
        'Type' => 'varchar(32)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cost_price' => 
      array (
        'Field' => 'cost_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reorder_level' => 
      array (
        'Field' => 'reorder_level',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'image_filename' => 
      array (
        'Field' => 'image_filename',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_number' => 
      array (
        'Field' => 'part_number',
        'Type' => 'varchar(64)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'barcode_number' => 
      array (
        'Field' => 'barcode_number',
        'Type' => 'varchar(64)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'brand_id' => 
      array (
        'Field' => 'brand_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'enum(\'Part\',\'Service\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'is_fifo' => 
      array (
        'Field' => 'is_fifo',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_expiry' => 
      array (
        'Field' => 'is_expiry',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'recipe_type' => 
      array (
        'Field' => 'recipe_type',
        'Type' => 'enum(\'Standard\',\'A La Carte\',\'Recipe\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Standard',
        'Extra' => '',
      ),
      'default_location_id' => 
      array (
        'Field' => 'default_location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'allowed_locations' => 
      array (
        'Field' => 'allowed_locations',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'wholesale_price' => 
      array (
        'Field' => 'wholesale_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'min_selling_price' => 
      array (
        'Field' => 'min_selling_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'price_2' => 
      array (
        'Field' => 'price_2',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'net_weight_kg' => 
      array (
        'Field' => 'net_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'gross_weight_kg' => 
      array (
        'Field' => 'gross_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'units_per_carton' => 
      array (
        'Field' => 'units_per_carton',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'carton_length_cm' => 
      array (
        'Field' => 'carton_length_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_width_cm' => 
      array (
        'Field' => 'carton_width_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_height_cm' => 
      array (
        'Field' => 'carton_height_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_tare_weight_kg' => 
      array (
        'Field' => 'carton_tare_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'packing_type' => 
      array (
        'Field' => 'packing_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Carton',
        'Extra' => '',
      ),
      'hs_code' => 
      array (
        'Field' => 'hs_code',
        'Type' => 'varchar(32)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'volume_cbm' => 
      array (
        'Field' => 'volume_cbm',
        'Type' => 'decimal(15,6)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000000',
        'Extra' => '',
      ),
      'is_online' => 
      array (
        'Field' => 'is_online',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'public_description' => 
      array (
        'Field' => 'public_description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'out_of_stock' => 
      array (
        'Field' => 'out_of_stock',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'item_section_id' => 
      array (
        'Field' => 'item_section_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_department_id' => 
      array (
        'Field' => 'item_department_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_category_id' => 
      array (
        'Field' => 'item_category_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'discount_type' => 
      array (
        'Field' => 'discount_type',
        'Type' => 'enum(\'None\',\'Percentage\',\'Fixed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'None',
        'Extra' => '',
      ),
      'discount_value' => 
      array (
        'Field' => 'discount_value',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'slug' => 
      array (
        'Field' => 'slug',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_parts_sku' => 
      array (
        'Key_name' => 'uq_parts_sku',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'sku',
        ),
      ),
      'uq_parts_slug' => 
      array (
        'Key_name' => 'uq_parts_slug',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'slug',
        ),
      ),
      'idx_parts_brand' => 
      array (
        'Key_name' => 'idx_parts_brand',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'brand_id',
        ),
      ),
      'idx_parts_section' => 
      array (
        'Key_name' => 'idx_parts_section',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_section_id',
        ),
      ),
      'idx_parts_dept' => 
      array (
        'Key_name' => 'idx_parts_dept',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_department_id',
        ),
      ),
      'idx_parts_cat' => 
      array (
        'Key_name' => 'idx_parts_cat',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_category_id',
        ),
      ),
    ),
  ),
  'parts_collections' => 
  array (
    'name' => 'parts_collections',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'collection_id' => 
      array (
        'Field' => 'collection_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_part_collection' => 
      array (
        'Key_name' => 'uq_part_collection',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'part_id',
          1 => 'collection_id',
        ),
      ),
      'idx_pc_part' => 
      array (
        'Key_name' => 'idx_pc_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_pc_collection' => 
      array (
        'Key_name' => 'idx_pc_collection',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'collection_id',
        ),
      ),
    ),
  ),
  'payment_notifications' => 
  array (
    'name' => 'payment_notifications',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'gateway' => 
      array (
        'Field' => 'gateway',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_id' => 
      array (
        'Field' => 'payment_id',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status_code' => 
      array (
        'Field' => 'status_code',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'currency' => 
      array (
        'Field' => 'currency',
        'Type' => 'varchar(10)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'raw_data' => 
      array (
        'Field' => 'raw_data',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'validation_status' => 
      array (
        'Field' => 'validation_status',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'payment_receipts' => 
  array (
    'name' => 'payment_receipts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'receipt_no' => 
      array (
        'Field' => 'receipt_no',
        'Type' => 'varchar(30)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'invoice_no' => 
      array (
        'Field' => 'invoice_no',
        'Type' => 'varchar(30)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '',
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_name' => 
      array (
        'Field' => 'customer_name',
        'Type' => 'varchar(150)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '',
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Cash',
        'Extra' => '',
      ),
      'reference_no' => 
      array (
        'Field' => 'reference_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'payment_date' => 
      array (
        'Field' => 'payment_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'card_type' => 
      array (
        'Field' => 'card_type',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'card_last4' => 
      array (
        'Field' => 'card_last4',
        'Type' => 'varchar(4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'card_auth_code' => 
      array (
        'Field' => 'card_auth_code',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bank_id' => 
      array (
        'Field' => 'bank_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'card_category' => 
      array (
        'Field' => 'card_category',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Received\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Received',
        'Extra' => '',
      ),
      'cancelled_at' => 
      array (
        'Field' => 'cancelled_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancelled_by' => 
      array (
        'Field' => 'cancelled_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cancellation_reason' => 
      array (
        'Field' => 'cancellation_reason',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'receipt_no' => 
      array (
        'Key_name' => 'receipt_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'receipt_no',
        ),
      ),
      'idx_pr_invoice' => 
      array (
        'Key_name' => 'idx_pr_invoice',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
      'idx_pr_customer' => 
      array (
        'Key_name' => 'idx_pr_customer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'idx_pr_date' => 
      array (
        'Key_name' => 'idx_pr_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'payment_date',
        ),
      ),
      'idx_pr_location' => 
      array (
        'Key_name' => 'idx_pr_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'payroll' => 
  array (
    'name' => 'payroll',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'employee_id' => 
      array (
        'Field' => 'employee_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'month' => 
      array (
        'Field' => 'month',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'year' => 
      array (
        'Field' => 'year',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'basic_salary' => 
      array (
        'Field' => 'basic_salary',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'allowances' => 
      array (
        'Field' => 'allowances',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'deductions' => 
      array (
        'Field' => 'deductions',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'net_salary' => 
      array (
        'Field' => 'net_salary',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'breakdown' => 
      array (
        'Field' => 'breakdown',
        'Type' => 'longtext',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Approved\',\'Paid\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'paid_at' => 
      array (
        'Field' => 'paid_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_payroll_emp_month' => 
      array (
        'Key_name' => 'uq_payroll_emp_month',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'employee_id',
          1 => 'month',
          2 => 'year',
        ),
      ),
      'idx_payroll_date' => 
      array (
        'Key_name' => 'idx_payroll_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'month',
          1 => 'year',
        ),
      ),
    ),
  ),
  'permissions' => 
  array (
    'name' => 'permissions',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'perm_key' => 
      array (
        'Field' => 'perm_key',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'perm_key' => 
      array (
        'Key_name' => 'perm_key',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'perm_key',
        ),
      ),
    ),
  ),
  'pos_held_order_items' => 
  array (
    'name' => 'pos_held_order_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'held_order_id' => 
      array (
        'Field' => 'held_order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'enum(\'Part\',\'Service\',\'Other\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.000',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount' => 
      array (
        'Field' => 'discount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_kot_printed' => 
      array (
        'Field' => 'is_kot_printed',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_phoi_order' => 
      array (
        'Key_name' => 'idx_phoi_order',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'held_order_id',
        ),
      ),
      'idx_phoi_item' => 
      array (
        'Key_name' => 'idx_phoi_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_id',
        ),
      ),
    ),
  ),
  'pos_held_orders' => 
  array (
    'name' => 'pos_held_orders',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_type' => 
      array (
        'Field' => 'order_type',
        'Type' => 'enum(\'dine_in\',\'take_away\',\'retail\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'retail',
        'Extra' => '',
      ),
      'table_id' => 
      array (
        'Field' => 'table_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'steward_id' => 
      array (
        'Field' => 'steward_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount_total' => 
      array (
        'Field' => 'discount_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'grand_total' => 
      array (
        'Field' => 'grand_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'pending\',\'completed\',\'cancelled\')',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => 'pending',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_pho_location' => 
      array (
        'Key_name' => 'idx_pho_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_pho_status' => 
      array (
        'Key_name' => 'idx_pho_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
    ),
  ),
  'printer_settings' => 
  array (
    'name' => 'printer_settings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'printer_type' => 
      array (
        'Field' => 'printer_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'printer_name' => 
      array (
        'Field' => 'printer_name',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'paper_width' => 
      array (
        'Field' => 'paper_width',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '80mm',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_location_printer_type' => 
      array (
        'Key_name' => 'uq_location_printer_type',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'location_id',
          1 => 'printer_type',
        ),
      ),
    ),
  ),
  'product_review_images' => 
  array (
    'name' => 'product_review_images',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'review_id' => 
      array (
        'Field' => 'review_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'image_path' => 
      array (
        'Field' => 'image_path',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'review_id' => 
      array (
        'Key_name' => 'review_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'review_id',
        ),
      ),
    ),
  ),
  'product_reviews' => 
  array (
    'name' => 'product_reviews',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rating' => 
      array (
        'Field' => 'rating',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'comment' => 
      array (
        'Field' => 'comment',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'admin_reply' => 
      array (
        'Field' => 'admin_reply',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Approved\',\'Rejected\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'replied_at' => 
      array (
        'Field' => 'replied_at',
        'Type' => 'timestamp',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
    ),
  ),
  'production_bom_items' => 
  array (
    'name' => 'production_bom_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'bom_id' => 
      array (
        'Field' => 'bom_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty' => 
      array (
        'Field' => 'qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'bom_id' => 
      array (
        'Key_name' => 'bom_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'bom_id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'production_boms' => 
  array (
    'name' => 'production_boms',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'output_part_id' => 
      array (
        'Field' => 'output_part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'version' => 
      array (
        'Field' => 'version',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1.0',
        'Extra' => '',
      ),
      'output_qty' => 
      array (
        'Field' => 'output_qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.000',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'output_part_id' => 
      array (
        'Key_name' => 'output_part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'output_part_id',
        ),
      ),
    ),
  ),
  'production_order_items' => 
  array (
    'name' => 'production_order_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'planned_qty' => 
      array (
        'Field' => 'planned_qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'actual_qty' => 
      array (
        'Field' => 'actual_qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(15,4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'total_cost' => 
      array (
        'Field' => 'total_cost',
        'Type' => 'decimal(15,4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_id' => 
      array (
        'Key_name' => 'order_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'production_order_outputs' => 
  array (
    'name' => 'production_order_outputs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_id' => 
      array (
        'Field' => 'order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bom_id' => 
      array (
        'Field' => 'bom_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'planned_qty' => 
      array (
        'Field' => 'planned_qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'actual_qty' => 
      array (
        'Field' => 'actual_qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_number' => 
      array (
        'Field' => 'batch_number',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expiry_date' => 
      array (
        'Field' => 'expiry_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'waste_reason' => 
      array (
        'Field' => 'waste_reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_id' => 
      array (
        'Key_name' => 'order_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'order_id',
        ),
      ),
      'bom_id' => 
      array (
        'Key_name' => 'bom_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'bom_id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'production_orders' => 
  array (
    'name' => 'production_orders',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'order_number' => 
      array (
        'Field' => 'order_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'bom_id' => 
      array (
        'Field' => 'bom_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty' => 
      array (
        'Field' => 'qty',
        'Type' => 'decimal(15,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'actual_yield' => 
      array (
        'Field' => 'actual_yield',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'waste_reason' => 
      array (
        'Field' => 'waste_reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Planned\',\'InProgress\',\'Completed\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Planned',
        'Extra' => '',
      ),
      'started_at' => 
      array (
        'Field' => 'started_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'completed_at' => 
      array (
        'Field' => 'completed_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'order_number' => 
      array (
        'Key_name' => 'order_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'order_number',
        ),
      ),
      'bom_id' => 
      array (
        'Key_name' => 'bom_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'bom_id',
        ),
      ),
      'location_id' => 
      array (
        'Key_name' => 'location_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'promotion_benefits' => 
  array (
    'name' => 'promotion_benefits',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'promotion_id' => 
      array (
        'Field' => 'promotion_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'benefit_type' => 
      array (
        'Field' => 'benefit_type',
        'Type' => 'enum(\'Percentage\',\'FixedAmount\',\'FixedPrice\',\'FreeItem\',\'BuyXGetY\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'benefit_value' => 
      array (
        'Field' => 'benefit_value',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'benefit_data' => 
      array (
        'Field' => 'benefit_data',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'trigger_items' => 
      array (
        'Field' => 'trigger_items',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reward_items' => 
      array (
        'Field' => 'reward_items',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'trigger_qty' => 
      array (
        'Field' => 'trigger_qty',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'reward_qty' => 
      array (
        'Field' => 'reward_qty',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'benefit_discount_pct' => 
      array (
        'Field' => 'benefit_discount_pct',
        'Type' => 'decimal(5,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '100.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'promotion_id' => 
      array (
        'Key_name' => 'promotion_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'promotion_id',
        ),
      ),
    ),
  ),
  'promotion_conditions' => 
  array (
    'name' => 'promotion_conditions',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'promotion_id' => 
      array (
        'Field' => 'promotion_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'condition_type' => 
      array (
        'Field' => 'condition_type',
        'Type' => 'enum(\'MinAmount\',\'MinQty\',\'ItemList\',\'CollectionList\',\'OrderType\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'requirement_value' => 
      array (
        'Field' => 'requirement_value',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'operator' => 
      array (
        'Field' => 'operator',
        'Type' => 'enum(\'>=\',\'=\',\'IN\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '>=',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'promotion_id' => 
      array (
        'Key_name' => 'promotion_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'promotion_id',
        ),
      ),
    ),
  ),
  'promotions' => 
  array (
    'name' => 'promotions',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'Discount\',\'Bundle\',\'BOGO\',\'Bulk\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Discount',
        'Extra' => '',
      ),
      'start_date' => 
      array (
        'Field' => 'start_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'end_date' => 
      array (
        'Field' => 'end_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'priority' => 
      array (
        'Field' => 'priority',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'applicable_locations' => 
      array (
        'Field' => 'applicable_locations',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'purchase_order_items' => 
  array (
    'name' => 'purchase_order_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'purchase_order_id' => 
      array (
        'Field' => 'purchase_order_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_ordered' => 
      array (
        'Field' => 'qty_ordered',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'received_qty' => 
      array (
        'Field' => 'received_qty',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_poi_po' => 
      array (
        'Key_name' => 'idx_poi_po',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'purchase_order_id',
        ),
      ),
      'idx_poi_part' => 
      array (
        'Key_name' => 'idx_poi_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_poi_item' => 
      array (
        'Key_name' => 'idx_poi_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'purchase_orders' => 
  array (
    'name' => 'purchase_orders',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'po_number' => 
      array (
        'Field' => 'po_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Sent\',\'Partially Received\',\'Received\',\'Cancelled\',\'Approved\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ordered_at' => 
      array (
        'Field' => 'ordered_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expected_at' => 
      array (
        'Field' => 'expected_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_purchase_orders_number' => 
      array (
        'Key_name' => 'uq_purchase_orders_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'po_number',
        ),
      ),
      'idx_purchase_orders_supplier' => 
      array (
        'Key_name' => 'idx_purchase_orders_supplier',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
      'idx_purchase_orders_location' => 
      array (
        'Key_name' => 'idx_purchase_orders_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_po_status' => 
      array (
        'Key_name' => 'idx_po_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'idx_po_date' => 
      array (
        'Key_name' => 'idx_po_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'ordered_at',
        ),
      ),
    ),
  ),
  'quotation_items' => 
  array (
    'name' => 'quotation_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'quotation_id' => 
      array (
        'Field' => 'quotation_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount' => 
      array (
        'Field' => 'discount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'quotation_id' => 
      array (
        'Key_name' => 'quotation_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'quotation_id',
        ),
      ),
    ),
  ),
  'quotation_taxes' => 
  array (
    'name' => 'quotation_taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'quotation_id' => 
      array (
        'Field' => 'quotation_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_name' => 
      array (
        'Field' => 'tax_name',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_code' => 
      array (
        'Field' => 'tax_code',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rate_percent' => 
      array (
        'Field' => 'rate_percent',
        'Type' => 'decimal(5,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'quotation_id' => 
      array (
        'Key_name' => 'quotation_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'quotation_id',
        ),
      ),
    ),
  ),
  'quotations' => 
  array (
    'name' => 'quotations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'quotation_no' => 
      array (
        'Field' => 'quotation_no',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'issue_date' => 
      array (
        'Field' => 'issue_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expiry_date' => 
      array (
        'Field' => 'expiry_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Sent\',\'Accepted\',\'Rejected\',\'Expired\',\'Converted\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount_total' => 
      array (
        'Field' => 'discount_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'grand_total' => 
      array (
        'Field' => 'grand_total',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'converted_invoice_id' => 
      array (
        'Field' => 'converted_invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'is_international' => 
      array (
        'Field' => 'is_international',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'shipping_provider_id' => 
      array (
        'Field' => 'shipping_provider_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_cost' => 
      array (
        'Field' => 'shipping_cost',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_country' => 
      array (
        'Field' => 'shipping_country',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_address' => 
      array (
        'Field' => 'shipping_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_costing_template_id' => 
      array (
        'Field' => 'shipping_costing_template_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'quotation_no' => 
      array (
        'Key_name' => 'quotation_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'quotation_no',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
    ),
  ),
  'recurring_invoice_items' => 
  array (
    'name' => 'recurring_invoice_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'recurring_invoice_id' => 
      array (
        'Field' => 'recurring_invoice_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'enum(\'Part\',\'Labor\',\'Service\',\'Other\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1.00',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount' => 
      array (
        'Field' => 'discount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'recurring_invoice_id' => 
      array (
        'Key_name' => 'recurring_invoice_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'recurring_invoice_id',
        ),
      ),
    ),
  ),
  'recurring_invoice_taxes' => 
  array (
    'name' => 'recurring_invoice_taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'recurring_template_id' => 
      array (
        'Field' => 'recurring_template_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_name' => 
      array (
        'Field' => 'tax_name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_code' => 
      array (
        'Field' => 'tax_code',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rate_percent' => 
      array (
        'Field' => 'rate_percent',
        'Type' => 'decimal(5,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'recurring_template_id' => 
      array (
        'Key_name' => 'recurring_template_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'recurring_template_id',
        ),
      ),
    ),
  ),
  'recurring_invoices' => 
  array (
    'name' => 'recurring_invoices',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'template_name' => 
      array (
        'Field' => 'template_name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'frequency' => 
      array (
        'Field' => 'frequency',
        'Type' => 'enum(\'Daily\',\'Weekly\',\'Monthly\',\'Yearly\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Monthly',
        'Extra' => '',
      ),
      'start_date' => 
      array (
        'Field' => 'start_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'end_date' => 
      array (
        'Field' => 'end_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'next_generation_date' => 
      array (
        'Field' => 'next_generation_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'last_generation_date' => 
      array (
        'Field' => 'last_generation_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Active\',\'Paused\',\'Completed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Active',
        'Extra' => '',
      ),
      'billing_address' => 
      array (
        'Field' => 'billing_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipping_address' => 
      array (
        'Field' => 'shipping_address',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'subtotal' => 
      array (
        'Field' => 'subtotal',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'tax_total' => 
      array (
        'Field' => 'tax_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'discount_total' => 
      array (
        'Field' => 'discount_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'shipping_fee' => 
      array (
        'Field' => 'shipping_fee',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'grand_total' => 
      array (
        'Field' => 'grand_total',
        'Type' => 'decimal(10,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'customer_id' => 
      array (
        'Key_name' => 'customer_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
    ),
  ),
  'refunds' => 
  array (
    'name' => 'refunds',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'refund_no' => 
      array (
        'Field' => 'refund_no',
        'Type' => 'varchar(30)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'return_id' => 
      array (
        'Field' => 'return_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'amount' => 
      array (
        'Field' => 'amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'payment_method' => 
      array (
        'Field' => 'payment_method',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Cash',
        'Extra' => '',
      ),
      'reference_no' => 
      array (
        'Field' => 'reference_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'refund_date' => 
      array (
        'Field' => 'refund_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'refund_no' => 
      array (
        'Key_name' => 'refund_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'refund_no',
        ),
      ),
      'idx_ref_invoice' => 
      array (
        'Key_name' => 'idx_ref_invoice',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
      'idx_ref_return' => 
      array (
        'Key_name' => 'idx_ref_return',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'return_id',
        ),
      ),
      'idx_ref_location' => 
      array (
        'Key_name' => 'idx_ref_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'repair_categories' => 
  array (
    'name' => 'repair_categories',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'repair_orders' => 
  array (
    'name' => 'repair_orders',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'customer_name' => 
      array (
        'Field' => 'customer_name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'vehicle_model' => 
      array (
        'Field' => 'vehicle_model',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'problem_description' => 
      array (
        'Field' => 'problem_description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'In Progress\',\'Completed\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'vehicle_id' => 
      array (
        'Field' => 'vehicle_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'vehicle_identifier' => 
      array (
        'Field' => 'vehicle_identifier',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'mileage' => 
      array (
        'Field' => 'mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'priority' => 
      array (
        'Field' => 'priority',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expected_time' => 
      array (
        'Field' => 'expected_time',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'comments' => 
      array (
        'Field' => 'comments',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'categories_json' => 
      array (
        'Field' => 'categories_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'checklist_json' => 
      array (
        'Field' => 'checklist_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location' => 
      array (
        'Field' => 'location',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'technician' => 
      array (
        'Field' => 'technician',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'attachments_json' => 
      array (
        'Field' => 'attachments_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'checklist_done_json' => 
      array (
        'Field' => 'checklist_done_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'completion_comments' => 
      array (
        'Field' => 'completion_comments',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'completed_at' => 
      array (
        'Field' => 'completed_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'release_time' => 
      array (
        'Field' => 'release_time',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'order_type' => 
      array (
        'Field' => 'order_type',
        'Type' => 'enum(\'Company\',\'Customer\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Company',
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'from_location_id' => 
      array (
        'Field' => 'from_location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'job_type' => 
      array (
        'Field' => 'job_type',
        'Type' => 'enum(\'Repair\',\'Service Booking\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Repair',
        'Extra' => '',
      ),
      'booking_date' => 
      array (
        'Field' => 'booking_date',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_repair_orders_location' => 
      array (
        'Key_name' => 'idx_repair_orders_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'restaurant_tables' => 
  array (
    'name' => 'restaurant_tables',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Available\',\'Occupied\',\'Reserved\',\'Out of Service\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Available',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_table_location' => 
      array (
        'Key_name' => 'idx_table_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'role_permissions' => 
  array (
    'name' => 'role_permissions',
    'columns' => 
    array (
      'role_id' => 
      array (
        'Field' => 'role_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'permission_id' => 
      array (
        'Field' => 'permission_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'role_id',
          1 => 'permission_id',
        ),
      ),
      'permission_id' => 
      array (
        'Key_name' => 'permission_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'permission_id',
        ),
      ),
    ),
  ),
  'roles' => 
  array (
    'name' => 'roles',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'routes' => 
  array (
    'name' => 'routes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'fk_routes_location' => 
      array (
        'Key_name' => 'fk_routes_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'saas_settings' => 
  array (
    'name' => 'saas_settings',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'plan_key' => 
      array (
        'Field' => 'plan_key',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'PRO',
        'Extra' => '',
      ),
      'module_overrides' => 
      array (
        'Field' => 'module_overrides',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'sales_return_items' => 
  array (
    'name' => 'sales_return_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'return_id' => 
      array (
        'Field' => 'return_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_id' => 
      array (
        'Field' => 'item_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'item_type' => 
      array (
        'Field' => 'item_type',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Part',
        'Extra' => '',
      ),
      'description' => 
      array (
        'Field' => 'description',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'line_total' => 
      array (
        'Field' => 'line_total',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_sri_return' => 
      array (
        'Key_name' => 'idx_sri_return',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'return_id',
        ),
      ),
      'idx_sri_item' => 
      array (
        'Key_name' => 'idx_sri_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'item_id',
        ),
      ),
    ),
  ),
  'sales_returns' => 
  array (
    'name' => 'sales_returns',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'return_no' => 
      array (
        'Field' => 'return_no',
        'Type' => 'varchar(30)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'invoice_id' => 
      array (
        'Field' => 'invoice_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'return_date' => 
      array (
        'Field' => 'return_date',
        'Type' => 'date',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'total_amount' => 
      array (
        'Field' => 'total_amount',
        'Type' => 'decimal(12,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Completed\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Completed',
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'return_no' => 
      array (
        'Key_name' => 'return_no',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'return_no',
        ),
      ),
      'idx_sr_invoice' => 
      array (
        'Key_name' => 'idx_sr_invoice',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'invoice_id',
        ),
      ),
      'idx_sr_date' => 
      array (
        'Key_name' => 'idx_sr_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'return_date',
        ),
      ),
      'idx_sr_customer' => 
      array (
        'Key_name' => 'idx_sr_customer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
      'idx_sr_location' => 
      array (
        'Key_name' => 'idx_sr_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'sales_targets' => 
  array (
    'name' => 'sales_targets',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'collection_id' => 
      array (
        'Field' => 'collection_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'target_month' => 
      array (
        'Field' => 'target_month',
        'Type' => 'varchar(7)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'target_value' => 
      array (
        'Field' => 'target_value',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'loc_col_month' => 
      array (
        'Key_name' => 'loc_col_month',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'location_id',
          1 => 'collection_id',
          2 => 'target_month',
        ),
      ),
    ),
  ),
  'segment_contacts' => 
  array (
    'name' => 'segment_contacts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'segment_id' => 
      array (
        'Field' => 'segment_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'segment_id' => 
      array (
        'Key_name' => 'segment_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'segment_id',
        ),
      ),
    ),
  ),
  'service_bays' => 
  array (
    'name' => 'service_bays',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Available\',\'Occupied\',\'Out of Service\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Available',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_service_bays_location' => 
      array (
        'Key_name' => 'idx_service_bays_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'service_locations' => 
  array (
    'name' => 'service_locations',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_type' => 
      array (
        'Field' => 'location_type',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'service',
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_no' => 
      array (
        'Field' => 'tax_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_label' => 
      array (
        'Field' => 'tax_label',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'allow_service_charge' => 
      array (
        'Field' => 'allow_service_charge',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'service_charge_rate' => 
      array (
        'Field' => 'service_charge_rate',
        'Type' => 'decimal(5,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'allow_dine_in' => 
      array (
        'Field' => 'allow_dine_in',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'allow_take_away' => 
      array (
        'Field' => 'allow_take_away',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'allow_retail' => 
      array (
        'Field' => 'allow_retail',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'is_pos_active' => 
      array (
        'Field' => 'is_pos_active',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'allow_production' => 
      array (
        'Field' => 'allow_production',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'allow_online' => 
      array (
        'Field' => 'allow_online',
        'Type' => 'tinyint(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'google_analytics_code' => 
      array (
        'Field' => 'google_analytics_code',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'facebook_pixel_code' => 
      array (
        'Field' => 'facebook_pixel_code',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'allowed_taxes_json' => 
      array (
        'Field' => 'allowed_taxes_json',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_mode' => 
      array (
        'Field' => 'tax_mode',
        'Type' => 'enum(\'inclusive\',\'exclusive\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'exclusive',
        'Extra' => '',
      ),
      'default_customer_id' => 
      array (
        'Field' => 'default_customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'branch_code' => 
      array (
        'Field' => 'branch_code',
        'Type' => 'varchar(10)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'BR01',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_service_locations_name' => 
      array (
        'Key_name' => 'uq_service_locations_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'shipping_carriers' => 
  array (
    'name' => 'shipping_carriers',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tracking_url' => 
      array (
        'Field' => 'tracking_url',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_default' => 
      array (
        'Field' => 'is_default',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'shipping_costing_items' => 
  array (
    'name' => 'shipping_costing_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'template_id' => 
      array (
        'Field' => 'template_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cost_type' => 
      array (
        'Field' => 'cost_type',
        'Type' => 'enum(\'Fixed\',\'Percentage\',\'Per Unit\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Fixed',
        'Extra' => '',
      ),
      'value' => 
      array (
        'Field' => 'value',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'template_id' => 
      array (
        'Key_name' => 'template_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'template_id',
        ),
      ),
    ),
  ),
  'shipping_costing_sheet_items' => 
  array (
    'name' => 'shipping_costing_sheet_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'sheet_id' => 
      array (
        'Field' => 'sheet_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'cost_type' => 
      array (
        'Field' => 'cost_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'value' => 
      array (
        'Field' => 'value',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'calculated_amount' => 
      array (
        'Field' => 'calculated_amount',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'absorption_method' => 
      array (
        'Field' => 'absorption_method',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Value',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'sheet_id' => 
      array (
        'Key_name' => 'sheet_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'sheet_id',
        ),
      ),
    ),
  ),
  'shipping_costing_sheet_products' => 
  array (
    'name' => 'shipping_costing_sheet_products',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'sheet_id' => 
      array (
        'Field' => 'sheet_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'quantity' => 
      array (
        'Field' => 'quantity',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'profit_margin' => 
      array (
        'Field' => 'profit_margin',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'profit_method' => 
      array (
        'Field' => 'profit_method',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'profit_base' => 
      array (
        'Field' => 'profit_base',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'weight' => 
      array (
        'Field' => 'weight',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'cbm' => 
      array (
        'Field' => 'cbm',
        'Type' => 'decimal(15,6)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000000',
        'Extra' => '',
      ),
      'packaging_type_id' => 
      array (
        'Field' => 'packaging_type_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'units_per_carton' => 
      array (
        'Field' => 'units_per_carton',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'carton_length_cm' => 
      array (
        'Field' => 'carton_length_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_width_cm' => 
      array (
        'Field' => 'carton_width_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_height_cm' => 
      array (
        'Field' => 'carton_height_cm',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'carton_tare_weight_kg' => 
      array (
        'Field' => 'carton_tare_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'net_weight_kg' => 
      array (
        'Field' => 'net_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'gross_weight_kg' => 
      array (
        'Field' => 'gross_weight_kg',
        'Type' => 'decimal(10,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'packing_type' => 
      array (
        'Field' => 'packing_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Carton',
        'Extra' => '',
      ),
      'hs_code' => 
      array (
        'Field' => 'hs_code',
        'Type' => 'varchar(32)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'volume_cbm' => 
      array (
        'Field' => 'volume_cbm',
        'Type' => 'decimal(15,6)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000000',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'sheet_id' => 
      array (
        'Key_name' => 'sheet_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'sheet_id',
        ),
      ),
      'part_id' => 
      array (
        'Key_name' => 'part_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'shipping_costing_sheets' => 
  array (
    'name' => 'shipping_costing_sheets',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'costing_number' => 
      array (
        'Field' => 'costing_number',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'template_id' => 
      array (
        'Field' => 'template_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reference_number' => 
      array (
        'Field' => 'reference_number',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'base_carrier_cost' => 
      array (
        'Field' => 'base_carrier_cost',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'total_quantity' => 
      array (
        'Field' => 'total_quantity',
        'Type' => 'decimal(15,3)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'total_cost' => 
      array (
        'Field' => 'total_cost',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Finalized\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'shipping_term' => 
      array (
        'Field' => 'shipping_term',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'freight_type' => 
      array (
        'Field' => 'freight_type',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'shipment_mode' => 
      array (
        'Field' => 'shipment_mode',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'LCL',
        'Extra' => '',
      ),
      'profit_method' => 
      array (
        'Field' => 'profit_method',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Markup',
        'Extra' => '',
      ),
      'profit_base' => 
      array (
        'Field' => 'profit_base',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Landed',
        'Extra' => '',
      ),
      'profit_value' => 
      array (
        'Field' => 'profit_value',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '10.00',
        'Extra' => '',
      ),
      'overhead_absorption_method' => 
      array (
        'Field' => 'overhead_absorption_method',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Value',
        'Extra' => '',
      ),
      'target_currency' => 
      array (
        'Field' => 'target_currency',
        'Type' => 'varchar(10)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'USD',
        'Extra' => '',
      ),
      'exchange_rate' => 
      array (
        'Field' => 'exchange_rate',
        'Type' => 'decimal(15,4)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1.0000',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_costing_number' => 
      array (
        'Key_name' => 'uq_costing_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'costing_number',
        ),
      ),
      'template_id' => 
      array (
        'Key_name' => 'template_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'template_id',
        ),
      ),
    ),
  ),
  'shipping_costing_templates' => 
  array (
    'name' => 'shipping_costing_templates',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'shipping_providers' => 
  array (
    'name' => 'shipping_providers',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'base_cost' => 
      array (
        'Field' => 'base_cost',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'shipping_zones' => 
  array (
    'name' => 'shipping_zones',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'base_fee' => 
      array (
        'Field' => 'base_fee',
        'Type' => 'decimal(15,2)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.00',
        'Extra' => '',
      ),
      'free_threshold' => 
      array (
        'Field' => 'free_threshold',
        'Type' => 'decimal(15,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'sms_campaigns' => 
  array (
    'name' => 'sms_campaigns',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'message' => 
      array (
        'Field' => 'message',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'target_segment' => 
      array (
        'Field' => 'target_segment',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'all',
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Draft\',\'Sent\',\'Cancelled\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Draft',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'sent_at' => 
      array (
        'Field' => 'sent_at',
        'Type' => 'timestamp',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'sms_logs' => 
  array (
    'name' => 'sms_logs',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'campaign_id' => 
      array (
        'Field' => 'campaign_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'recipient' => 
      array (
        'Field' => 'recipient',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'message' => 
      array (
        'Field' => 'message',
        'Type' => 'text',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Success\',\'Failed\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Success',
        'Extra' => '',
      ),
      'error_message' => 
      array (
        'Field' => 'error_message',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'sent_at' => 
      array (
        'Field' => 'sent_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'stock_adjustment_items' => 
  array (
    'name' => 'stock_adjustment_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'stock_adjustment_id' => 
      array (
        'Field' => 'stock_adjustment_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_id' => 
      array (
        'Field' => 'batch_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_change' => 
      array (
        'Field' => 'qty_change',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'system_stock' => 
      array (
        'Field' => 'system_stock',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'physical_stock' => 
      array (
        'Field' => 'physical_stock',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_sai_adj' => 
      array (
        'Key_name' => 'idx_sai_adj',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'stock_adjustment_id',
        ),
      ),
      'idx_sai_part' => 
      array (
        'Key_name' => 'idx_sai_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_sai_batch' => 
      array (
        'Key_name' => 'idx_sai_batch',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'batch_id',
        ),
      ),
    ),
  ),
  'stock_adjustments' => 
  array (
    'name' => 'stock_adjustments',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'adjustment_number' => 
      array (
        'Field' => 'adjustment_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'adjusted_at' => 
      array (
        'Field' => 'adjusted_at',
        'Type' => 'datetime',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Approved\',\'Rejected\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'approved_by' => 
      array (
        'Field' => 'approved_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_at' => 
      array (
        'Field' => 'approved_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_stock_adjustments_number' => 
      array (
        'Key_name' => 'uq_stock_adjustments_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'adjustment_number',
        ),
      ),
      'idx_stock_adjustments_date' => 
      array (
        'Key_name' => 'idx_stock_adjustments_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'adjusted_at',
        ),
      ),
      'idx_stock_adjustments_location' => 
      array (
        'Key_name' => 'idx_stock_adjustments_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'stock_count_items' => 
  array (
    'name' => 'stock_count_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'stock_count_id' => 
      array (
        'Field' => 'stock_count_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_id' => 
      array (
        'Field' => 'batch_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'system_stock' => 
      array (
        'Field' => 'system_stock',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'physical_stock' => 
      array (
        'Field' => 'physical_stock',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'variance' => 
      array (
        'Field' => 'variance',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_sci_count' => 
      array (
        'Key_name' => 'idx_sci_count',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'stock_count_id',
        ),
      ),
      'idx_sci_part' => 
      array (
        'Key_name' => 'idx_sci_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_sci_batch' => 
      array (
        'Key_name' => 'idx_sci_batch',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'batch_id',
        ),
      ),
    ),
  ),
  'stock_counts' => 
  array (
    'name' => 'stock_counts',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'count_number' => 
      array (
        'Field' => 'count_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'counted_at' => 
      array (
        'Field' => 'counted_at',
        'Type' => 'datetime',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'reason' => 
      array (
        'Field' => 'reason',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Pending\',\'Approved\',\'Rejected\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Pending',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_by' => 
      array (
        'Field' => 'approved_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_at' => 
      array (
        'Field' => 'approved_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_stock_counts_number' => 
      array (
        'Key_name' => 'uq_stock_counts_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'count_number',
        ),
      ),
      'idx_stock_counts_location' => 
      array (
        'Key_name' => 'idx_stock_counts_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_stock_counts_date' => 
      array (
        'Key_name' => 'idx_stock_counts_date',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'counted_at',
        ),
      ),
      'idx_stock_counts_status' => 
      array (
        'Key_name' => 'idx_stock_counts_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
    ),
  ),
  'stock_movements' => 
  array (
    'name' => 'stock_movements',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_id' => 
      array (
        'Field' => 'batch_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_change' => 
      array (
        'Field' => 'qty_change',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'movement_type' => 
      array (
        'Field' => 'movement_type',
        'Type' => 'enum(\'GRN\',\'ORDER_ISSUE\',\'ADJUSTMENT\',\'TRANSFER_IN\',\'TRANSFER_OUT\',\'PRODUCTION_CONSUMPTION\',\'PRODUCTION_RECEIPT\',\'SALE\',\'SALES_RETURN\',\'PURCHASE_RETURN\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ref_table' => 
      array (
        'Field' => 'ref_table',
        'Type' => 'varchar(64)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'ref_id' => 
      array (
        'Field' => 'ref_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_cost' => 
      array (
        'Field' => 'unit_cost',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'unit_price' => 
      array (
        'Field' => 'unit_price',
        'Type' => 'decimal(10,2)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_stock_movements_part' => 
      array (
        'Key_name' => 'idx_stock_movements_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_stock_movements_type' => 
      array (
        'Key_name' => 'idx_stock_movements_type',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'movement_type',
        ),
      ),
      'idx_stock_movements_location' => 
      array (
        'Key_name' => 'idx_stock_movements_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
      'idx_sm_batch' => 
      array (
        'Key_name' => 'idx_sm_batch',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'batch_id',
        ),
      ),
      'idx_sm_ref' => 
      array (
        'Key_name' => 'idx_sm_ref',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'ref_id',
        ),
      ),
      'idx_sm_created' => 
      array (
        'Key_name' => 'idx_sm_created',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'created_at',
        ),
      ),
    ),
  ),
  'stock_transfer_items' => 
  array (
    'name' => 'stock_transfer_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'transfer_id' => 
      array (
        'Field' => 'transfer_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'batch_id' => 
      array (
        'Field' => 'batch_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty' => 
      array (
        'Field' => 'qty',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_sti_transfer' => 
      array (
        'Key_name' => 'idx_sti_transfer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'transfer_id',
        ),
      ),
      'idx_sti_part' => 
      array (
        'Key_name' => 'idx_sti_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
      'idx_sti_batch' => 
      array (
        'Key_name' => 'idx_sti_batch',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'batch_id',
        ),
      ),
      'idx_sti_item' => 
      array (
        'Key_name' => 'idx_sti_item',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'stock_transfer_requests' => 
  array (
    'name' => 'stock_transfer_requests',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'transfer_number' => 
      array (
        'Field' => 'transfer_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'requisition_id' => 
      array (
        'Field' => 'requisition_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'from_location_id' => 
      array (
        'Field' => 'from_location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'to_location_id' => 
      array (
        'Field' => 'to_location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Requested\',\'Received\',\'Cancelled\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Requested',
        'Extra' => '',
      ),
      'requested_at' => 
      array (
        'Field' => 'requested_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'received_by' => 
      array (
        'Field' => 'received_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'received_at' => 
      array (
        'Field' => 'received_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_str_number' => 
      array (
        'Key_name' => 'uq_str_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'transfer_number',
        ),
      ),
      'idx_str_from' => 
      array (
        'Key_name' => 'idx_str_from',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'from_location_id',
        ),
      ),
      'idx_str_to' => 
      array (
        'Key_name' => 'idx_str_to',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'to_location_id',
        ),
      ),
      'idx_str_status' => 
      array (
        'Key_name' => 'idx_str_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'idx_str_req' => 
      array (
        'Key_name' => 'idx_str_req',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'requisition_id',
        ),
      ),
    ),
  ),
  'stock_transfer_requisition_items' => 
  array (
    'name' => 'stock_transfer_requisition_items',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'requisition_id' => 
      array (
        'Field' => 'requisition_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'part_id' => 
      array (
        'Field' => 'part_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_requested' => 
      array (
        'Field' => 'qty_requested',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'qty_fulfilled' => 
      array (
        'Field' => 'qty_fulfilled',
        'Type' => 'decimal(12,3)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.000',
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'idx_strqi_req' => 
      array (
        'Key_name' => 'idx_strqi_req',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'requisition_id',
        ),
      ),
      'idx_strqi_part' => 
      array (
        'Key_name' => 'idx_strqi_part',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'part_id',
        ),
      ),
    ),
  ),
  'stock_transfer_requisitions' => 
  array (
    'name' => 'stock_transfer_requisitions',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'requisition_number' => 
      array (
        'Field' => 'requisition_number',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'from_location_id' => 
      array (
        'Field' => 'from_location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'to_location_id' => 
      array (
        'Field' => 'to_location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Requested\',\'Approved\',\'Cancelled\',\'Fulfilled\')',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => 'Requested',
        'Extra' => '',
      ),
      'requested_at' => 
      array (
        'Field' => 'requested_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'notes' => 
      array (
        'Field' => 'notes',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_by' => 
      array (
        'Field' => 'approved_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'approved_at' => 
      array (
        'Field' => 'approved_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_strq_number' => 
      array (
        'Key_name' => 'uq_strq_number',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'requisition_number',
        ),
      ),
      'idx_strq_to' => 
      array (
        'Key_name' => 'idx_strq_to',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'to_location_id',
        ),
      ),
      'idx_strq_status' => 
      array (
        'Key_name' => 'idx_strq_status',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'status',
        ),
      ),
      'idx_strq_from' => 
      array (
        'Key_name' => 'idx_strq_from',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'from_location_id',
        ),
      ),
    ),
  ),
  'storefront_menus' => 
  array (
    'name' => 'storefront_menus',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'parent_id' => 
      array (
        'Field' => 'parent_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'label' => 
      array (
        'Field' => 'label',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'link_type' => 
      array (
        'Field' => 'link_type',
        'Type' => 'enum(\'Internal\',\'External\',\'Category\',\'Collection\',\'Heading\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'Internal',
        'Extra' => '',
      ),
      'link_value' => 
      array (
        'Field' => 'link_value',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'sort_order' => 
      array (
        'Field' => 'sort_order',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'is_mega_menu' => 
      array (
        'Field' => 'is_mega_menu',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'parent_id' => 
      array (
        'Key_name' => 'parent_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'parent_id',
        ),
      ),
    ),
  ),
  'storefront_settings' => 
  array (
    'name' => 'storefront_settings',
    'columns' => 
    array (
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => '1',
        'Extra' => '',
      ),
      'key' => 
      array (
        'Field' => 'key',
        'Type' => 'varchar(64)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'value' => 
      array (
        'Field' => 'value',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'label' => 
      array (
        'Field' => 'label',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'group' => 
      array (
        'Field' => 'group',
        'Type' => 'varchar(32)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'general',
        'Extra' => '',
      ),
      'type' => 
      array (
        'Field' => 'type',
        'Type' => 'enum(\'text\',\'color\',\'url\',\'textarea\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'text',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'location_id',
          1 => 'key',
        ),
      ),
    ),
  ),
  'supplier_taxes' => 
  array (
    'name' => 'supplier_taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'supplier_id' => 
      array (
        'Field' => 'supplier_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'tax_id' => 
      array (
        'Field' => 'tax_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_supplier_tax' => 
      array (
        'Key_name' => 'uq_supplier_tax',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'supplier_id',
          1 => 'tax_id',
        ),
      ),
      'idx_supplier_tax_supplier' => 
      array (
        'Key_name' => 'idx_supplier_tax_supplier',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'supplier_id',
        ),
      ),
      'idx_supplier_tax_tax' => 
      array (
        'Key_name' => 'idx_supplier_tax_tax',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'tax_id',
        ),
      ),
    ),
  ),
  'suppliers' => 
  array (
    'name' => 'suppliers',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'phone' => 
      array (
        'Field' => 'phone',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'address' => 
      array (
        'Field' => 'address',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
      'tax_reg_no' => 
      array (
        'Field' => 'tax_reg_no',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'is_inventory_vendor' => 
      array (
        'Field' => 'is_inventory_vendor',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'is_banquet_vendor' => 
      array (
        'Field' => 'is_banquet_vendor',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_suppliers_name' => 
      array (
        'Key_name' => 'uq_suppliers_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'system_settings' => 
  array (
    'name' => 'system_settings',
    'columns' => 
    array (
      'setting_key' => 
      array (
        'Field' => 'setting_key',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'setting_value' => 
      array (
        'Field' => 'setting_value',
        'Type' => 'text',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'setting_key',
        ),
      ),
    ),
  ),
  'taxes' => 
  array (
    'name' => 'taxes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'code' => 
      array (
        'Field' => 'code',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'rate_percent' => 
      array (
        'Field' => 'rate_percent',
        'Type' => 'decimal(9,4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '0.0000',
        'Extra' => '',
      ),
      'apply_on' => 
      array (
        'Field' => 'apply_on',
        'Type' => 'enum(\'base\',\'base_plus_previous\')',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'base',
        'Extra' => '',
      ),
      'sort_order' => 
      array (
        'Field' => 'sort_order',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '100',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'code' => 
      array (
        'Key_name' => 'code',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'code',
        ),
      ),
    ),
  ),
  'technicians' => 
  array (
    'name' => 'technicians',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'role' => 
      array (
        'Field' => 'role',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
    ),
  ),
  'term_factor_defaults' => 
  array (
    'name' => 'term_factor_defaults',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'shipping_term' => 
      array (
        'Field' => 'shipping_term',
        'Type' => 'varchar(20)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'factor_id' => 
      array (
        'Field' => 'factor_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'factor_id' => 
      array (
        'Key_name' => 'factor_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'factor_id',
        ),
      ),
    ),
  ),
  'units' => 
  array (
    'name' => 'units',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(50)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'user_locations' => 
  array (
    'name' => 'user_locations',
    'columns' => 
    array (
      'user_id' => 
      array (
        'Field' => 'user_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'user_id',
          1 => 'location_id',
        ),
      ),
      'idx_user_locations_location' => 
      array (
        'Key_name' => 'idx_user_locations_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'users' => 
  array (
    'name' => 'users',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'email' => 
      array (
        'Field' => 'email',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'password_hash' => 
      array (
        'Field' => 'password_hash',
        'Type' => 'varchar(255)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'role_id' => 
      array (
        'Field' => 'role_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'location_id' => 
      array (
        'Field' => 'location_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => '1',
        'Extra' => '',
      ),
      'is_active' => 
      array (
        'Field' => 'is_active',
        'Type' => 'tinyint(1)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => '1',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'email' => 
      array (
        'Key_name' => 'email',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'email',
        ),
      ),
      'idx_users_role' => 
      array (
        'Key_name' => 'idx_users_role',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'role_id',
        ),
      ),
      'idx_users_location' => 
      array (
        'Key_name' => 'idx_users_location',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'location_id',
        ),
      ),
    ),
  ),
  'vehicle_documents' => 
  array (
    'name' => 'vehicle_documents',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'vehicle_id' => 
      array (
        'Field' => 'vehicle_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'document_type' => 
      array (
        'Field' => 'document_type',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'document_number' => 
      array (
        'Field' => 'document_number',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'file_path' => 
      array (
        'Field' => 'file_path',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'expiry_date' => 
      array (
        'Field' => 'expiry_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'status' => 
      array (
        'Field' => 'status',
        'Type' => 'enum(\'Active\',\'Archived\')',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'Active',
        'Extra' => '',
      ),
      'reminder_sent' => 
      array (
        'Field' => 'reminder_sent',
        'Type' => 'tinyint(1)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'updated_at' => 
      array (
        'Field' => 'updated_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => 'on update current_timestamp()',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'vehicle_id' => 
      array (
        'Key_name' => 'vehicle_id',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'vehicle_id',
        ),
      ),
    ),
  ),
  'vehicle_makes' => 
  array (
    'name' => 'vehicle_makes',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'name' => 
      array (
        'Key_name' => 'name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'name',
        ),
      ),
    ),
  ),
  'vehicle_models' => 
  array (
    'name' => 'vehicle_models',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'make_id' => 
      array (
        'Field' => 'make_id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'name' => 
      array (
        'Field' => 'name',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'uq_vehicle_models_make_name' => 
      array (
        'Key_name' => 'uq_vehicle_models_make_name',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'make_id',
          1 => 'name',
        ),
      ),
    ),
  ),
  'vehicles' => 
  array (
    'name' => 'vehicles',
    'columns' => 
    array (
      'id' => 
      array (
        'Field' => 'id',
        'Type' => 'int(11)',
        'Null' => 'NO',
        'Key' => 'PRI',
        'Default' => NULL,
        'Extra' => 'auto_increment',
      ),
      'make' => 
      array (
        'Field' => 'make',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'model' => 
      array (
        'Field' => 'model',
        'Type' => 'varchar(100)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'year' => 
      array (
        'Field' => 'year',
        'Type' => 'year(4)',
        'Null' => 'NO',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'vin' => 
      array (
        'Field' => 'vin',
        'Type' => 'varchar(17)',
        'Null' => 'NO',
        'Key' => 'UNI',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_by' => 
      array (
        'Field' => 'created_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'updated_by' => 
      array (
        'Field' => 'updated_by',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'created_at' => 
      array (
        'Field' => 'created_at',
        'Type' => 'timestamp',
        'Null' => 'NO',
        'Key' => '',
        'Default' => 'current_timestamp()',
        'Extra' => '',
      ),
      'image_filename' => 
      array (
        'Field' => 'image_filename',
        'Type' => 'varchar(255)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'department_id' => 
      array (
        'Field' => 'department_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'customer_id' => 
      array (
        'Field' => 'customer_id',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => 'MUL',
        'Default' => NULL,
        'Extra' => '',
      ),
      'source' => 
      array (
        'Field' => 'source',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'manual',
        'Extra' => '',
      ),
      'external_id' => 
      array (
        'Field' => 'external_id',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'category' => 
      array (
        'Field' => 'category',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'work_type' => 
      array (
        'Field' => 'work_type',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'external_location' => 
      array (
        'Field' => 'external_location',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'driver_name' => 
      array (
        'Field' => 'driver_name',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'fuel_capacity' => 
      array (
        'Field' => 'fuel_capacity',
        'Type' => 'varchar(50)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'last_sync_at' => 
      array (
        'Field' => 'last_sync_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'external_make' => 
      array (
        'Field' => 'external_make',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'external_model' => 
      array (
        'Field' => 'external_model',
        'Type' => 'varchar(100)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'current_mileage' => 
      array (
        'Field' => 'current_mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'morning_mileage' => 
      array (
        'Field' => 'morning_mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => '0',
        'Extra' => '',
      ),
      'mileage_last_synced_at' => 
      array (
        'Field' => 'mileage_last_synced_at',
        'Type' => 'datetime',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'service_interval_mileage' => 
      array (
        'Field' => 'service_interval_mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'next_service_mileage' => 
      array (
        'Field' => 'next_service_mileage',
        'Type' => 'int(11)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'next_service_date' => 
      array (
        'Field' => 'next_service_date',
        'Type' => 'date',
        'Null' => 'YES',
        'Key' => '',
        'Default' => NULL,
        'Extra' => '',
      ),
      'mileage_sync_status' => 
      array (
        'Field' => 'mileage_sync_status',
        'Type' => 'varchar(20)',
        'Null' => 'YES',
        'Key' => '',
        'Default' => 'pending',
        'Extra' => '',
      ),
    ),
    'indexes' => 
    array (
      'PRIMARY' => 
      array (
        'Key_name' => 'PRIMARY',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'id',
        ),
      ),
      'vin' => 
      array (
        'Key_name' => 'vin',
        'Non_unique' => 0,
        'Columns' => 
        array (
          0 => 'vin',
        ),
      ),
      'idx_vehicles_department' => 
      array (
        'Key_name' => 'idx_vehicles_department',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'department_id',
        ),
      ),
      'fk_vehicles_customer' => 
      array (
        'Key_name' => 'fk_vehicles_customer',
        'Non_unique' => 1,
        'Columns' => 
        array (
          0 => 'customer_id',
        ),
      ),
    ),
  ),
);
    }
}
