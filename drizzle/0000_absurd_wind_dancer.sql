CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'kepala_sekolah', 'admin_tu', 'bendahara');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'promoted', 'graduated', 'transferred_out', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."payment_bill_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'reversal', 'adjustment', 'overpayment');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('lomba', 'kegiatan_rutin', 'rapat', 'libur', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "school_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" varchar(50) NOT NULL,
	"npsn" varchar(20),
	"address" text,
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"address" text,
	"legal_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_school_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"name" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"nip" varchar(50),
	"nik" varchar(16) NOT NULL,
	"nama_lengkap" varchar(255) NOT NULL,
	"tempat_lahir" varchar(100),
	"tanggal_lahir" date,
	"jenis_kelamin" varchar(1) NOT NULL,
	"nomor_hp" varchar(20),
	"alamat" text,
	"status_kepegawaian" varchar(20) NOT NULL,
	"mata_pelajaran" text,
	"tanggal_bergabung" date,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"nis" varchar(20),
	"nisn" varchar(10) NOT NULL,
	"nama_lengkap" varchar(255) NOT NULL,
	"nik" varchar(16),
	"tempat_lahir" varchar(100),
	"tanggal_lahir" date,
	"jenis_kelamin" varchar(1) NOT NULL,
	"nama_wali" varchar(255),
	"nomor_hp_wali" varchar(20),
	"nama_ayah" varchar(255),
	"nama_ibu" varchar(255),
	"alamat" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"grade_level" integer NOT NULL,
	"homeroom_teacher_id" uuid,
	"capacity" integer DEFAULT 32 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"from_status" "enrollment_status" NOT NULL,
	"to_status" "enrollment_status" NOT NULL,
	"changed_by" varchar(255) NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"transfer_destination" varchar(255),
	"graduation_date" date,
	"enrolled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_payment_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"category_id" uuid,
	"academic_year_id" uuid NOT NULL,
	"discount_type" varchar(10) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"reason" varchar(255),
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"billing_month" varchar(7) NOT NULL,
	"base_amount" numeric(15, 2) NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 2) NOT NULL,
	"status" "payment_bill_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "billing_month_check" CHECK ("payment_bills"."billing_month" ~ '^\d{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "payment_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"period" varchar(20) NOT NULL,
	"default_amount" numeric(15, 2),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" varchar(30),
	"notes" text,
	"reversed_by_id" uuid,
	"recorded_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashflow_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashflow_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"transaction_date" date NOT NULL,
	"description" text,
	"payment_method" varchar(30),
	"reference_number" varchar(100),
	"spp_payment_id" uuid,
	"recorded_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "event_category" NOT NULL,
	"start_date" date,
	"end_date" date,
	"location" varchar(255),
	"description" text,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"unit_id" uuid,
	"actor_id" varchar(255) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_units" ADD CONSTRAINT "school_units_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_school_assignments" ADD CONSTRAINT "user_school_assignments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_school_assignments" ADD CONSTRAINT "user_school_assignments_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_teachers_id_fk" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_status_history" ADD CONSTRAINT "enrollment_status_history_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_payment_rates" ADD CONSTRAINT "class_payment_rates_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_payment_rates" ADD CONSTRAINT "class_payment_rates_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_payment_rates" ADD CONSTRAINT "class_payment_rates_category_id_payment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."payment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_payment_rates" ADD CONSTRAINT "class_payment_rates_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_category_id_payment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."payment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_category_id_payment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."payment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_categories" ADD CONSTRAINT "payment_categories_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_categories" ADD CONSTRAINT "payment_categories_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_bill_id_payment_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."payment_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_reversed_by_id_payment_transactions_id_fk" FOREIGN KEY ("reversed_by_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_categories" ADD CONSTRAINT "cashflow_categories_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_categories" ADD CONSTRAINT "cashflow_categories_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_category_id_cashflow_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cashflow_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_spp_payment_id_payment_transactions_id_fk" FOREIGN KEY ("spp_payment_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_unit_id_school_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."school_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_units_school_idx" ON "school_units" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "user_assignments_clerk_idx" ON "user_school_assignments" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignment_unique" ON "user_school_assignments" USING btree ("clerk_user_id","school_id","unit_id");--> statement-breakpoint
CREATE INDEX "academic_years_unit_idx" ON "academic_years" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "teachers_school_unit_idx" ON "teachers" USING btree ("school_id","unit_id");--> statement-breakpoint
CREATE INDEX "teachers_nik_idx" ON "teachers" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "students_school_unit_idx" ON "students" USING btree ("school_id","unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_nisn_school_unique" ON "students" USING btree ("nisn","school_id");--> statement-breakpoint
CREATE INDEX "classes_year_idx" ON "classes" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "classes_unit_year_idx" ON "classes" USING btree ("unit_id","academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_student_year_unique" ON "enrollments" USING btree ("student_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "enrollments_class_idx" ON "enrollments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "class_payment_rates_unique" ON "class_payment_rates" USING btree ("class_id","category_id","academic_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_bills_unique" ON "payment_bills" USING btree ("enrollment_id","category_id","billing_month");--> statement-breakpoint
CREATE INDEX "payment_bills_enrollment_idx" ON "payment_bills" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_bill_idx" ON "payment_transactions" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "cashflow_transactions_unit_year_idx" ON "cashflow_transactions" USING btree ("unit_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "cashflow_transactions_date_idx" ON "cashflow_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "school_events_unit_year_idx" ON "school_events" USING btree ("unit_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "school_events_start_date_idx" ON "school_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "activity_logs_unit_idx" ON "activity_logs" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");