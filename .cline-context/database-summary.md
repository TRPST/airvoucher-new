# Database Tables Summary

## 1. `commission_group_rates`

- **id**: uuid (Primary Key)
- **commission_group_id**: uuid (Foreign Key)
- **voucher_type_id**: uuid (Foreign Key)
- **retailer_pct**: numeric(5,2)
- **agent_pct**: numeric(5,2)
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone

## 2. `commission_groups`

- **id**: uuid (Primary Key)
- **name**: text
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone

## 3. `profiles`

- **id**: uuid (Primary Key, Foreign Key to `auth.users`)
- **role**: text
- **full_name**: text
- **email**: text
- **phone**: text (Nullable)
- **avatar_url**: text (Nullable)
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone

## 4. `retailers`

- **id**: uuid (Primary Key)
- **user_profile_id**: uuid (Foreign Key)
- **name**: text
- **contact_name**: text (Nullable)
- **contact_email**: text (Nullable)
- **location**: text (Nullable)
- **agent_profile_id**: uuid (Foreign Key, Nullable)
- **commission_group_id**: uuid (Foreign Key, Nullable)
- **balance**: numeric(12,2)
- **credit_limit**: numeric(12,2)
- **credit_used**: numeric(12,2)
- **commission_balance**: numeric(12,2)
- **status**: text
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone

## 5. `sales`

- **id**: uuid (Primary Key)
- **terminal_id**: uuid (Foreign Key, Nullable)
- **voucher_inventory_id**: uuid (Foreign Key)
- **sale_amount**: numeric(12,2)
- **retailer_commission**: numeric(12,2)
- **agent_commission**: numeric(12,2)
- **created_at**: timestamp with time zone

## 6. `terminals`

- **id**: uuid (Primary Key)
- **retailer_id**: uuid (Foreign Key)
- **name**: text
- **last_active**: timestamp with time zone (Nullable)
- **status**: text
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone

## 7. `transactions`

- **id**: uuid (Primary Key)
- **type**: text
- **amount**: numeric(12,2)
- **balance_after**: numeric(12,2)
- **retailer_id**: uuid (Foreign Key, Nullable)
- **agent_profile_id**: uuid (Foreign Key, Nullable)
- **sale_id**: uuid (Foreign Key, Nullable)
- **notes**: text (Nullable)
- **created_at**: timestamp with time zone

## 8. `voucher_inventory`

- **id**: uuid (Primary Key)
- **voucher_type_id**: uuid (Foreign Key)
- **amount**: numeric(12,2)
- **pin**: text
- **serial_number**: text (Nullable)
- **expiry_date**: date (Nullable)
- **status**: text
- **created_at**: timestamp with time zone
- **sold_at**: timestamp with time zone (Nullable)

## 9. `voucher_types`

- **id**: uuid (Primary Key)
- **name**: text
- **supplier_commission_pct**: numeric(5,2)
- **created_at**: timestamp with time zone
- **updated_at**: timestamp with time zone
