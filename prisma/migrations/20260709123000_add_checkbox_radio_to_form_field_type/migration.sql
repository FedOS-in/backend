-- Add new values to FormFieldType enum used by form_fields.field_type
ALTER TYPE "FormFieldType" ADD VALUE IF NOT EXISTS 'CHECKBOX';
ALTER TYPE "FormFieldType" ADD VALUE IF NOT EXISTS 'RADIO';
