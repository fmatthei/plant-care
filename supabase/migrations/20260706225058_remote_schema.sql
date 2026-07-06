


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_my_household_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select household_id from household_members
  where user_id = auth.uid()
    and deleted_at is null;
$$;


ALTER FUNCTION "public"."get_my_household_ids"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "plant_id" "uuid",
    "household_member_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_name" "text" NOT NULL,
    "action" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid",
    "task_id" "uuid",
    "household_member_id" "uuid",
    "task_name" "text",
    "task_type" "text",
    "date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."care_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."household_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid",
    "user_id" "uuid",
    "display_name" "text" NOT NULL,
    "color" "text",
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "calendar_time" "text" DEFAULT '20:00'::"text" NOT NULL,
    "calendar_weekend_time" "text",
    "notifications_enabled" boolean DEFAULT false NOT NULL,
    "onboarding_completed_at" timestamp with time zone
);


ALTER TABLE "public"."household_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."households" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid",
    "household_member_id" "uuid",
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "task_id" "uuid",
    "photo_url" "text"
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plant_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid",
    "note_id" "uuid",
    "storage_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plant_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid",
    "name" "text" NOT NULL,
    "emoji" "text",
    "date_acquired" "date",
    "sort_order" double precision DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "photo_url" "text"
);


ALTER TABLE "public"."plants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_member_id" "uuid",
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid",
    "name" "text" NOT NULL,
    "icon" "text",
    "type" "text",
    "recurrence" "jsonb",
    "owner_id" "uuid",
    "last_done" "date",
    "next_due_override" "date",
    "paused" boolean DEFAULT false,
    "note" "text",
    "sort_order" double precision DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "pre_completion_last_done" "date",
    "pre_completion_next_due_override" "date"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_log"
    ADD CONSTRAINT "care_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plant_photos"
    ADD CONSTRAINT "plant_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plants"
    ADD CONSTRAINT "plants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_member_unique" UNIQUE ("household_member_id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_household_member_id_fkey" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id");



ALTER TABLE ONLY "public"."care_log"
    ADD CONSTRAINT "care_log_household_member_id_fkey" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id");



ALTER TABLE ONLY "public"."care_log"
    ADD CONSTRAINT "care_log_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id");



ALTER TABLE ONLY "public"."care_log"
    ADD CONSTRAINT "care_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_household_member_id_fkey" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id");



ALTER TABLE ONLY "public"."plant_photos"
    ADD CONSTRAINT "plant_photos_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id");



ALTER TABLE ONLY "public"."plant_photos"
    ADD CONSTRAINT "plant_photos_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id");



ALTER TABLE ONLY "public"."plants"
    ADD CONSTRAINT "plants_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_household_member_id_fkey" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."household_members"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id");



CREATE POLICY "App admins can insert household_members" ON "public"."household_members" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "App admins can insert households" ON "public"."households" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "App admins can select all household_members" ON "public"."household_members" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "App admins can select all households" ON "public"."households" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "App admins can update household_members" ON "public"."household_members" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "App admins can update households" ON "public"."households" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text"))::boolean = true));



CREATE POLICY "Authenticated users can delete plant_photos" ON "public"."plant_photos" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert plant_photos" ON "public"."plant_photos" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read plant_photos" ON "public"."plant_photos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Members can manage care log in their households" ON "public"."care_log" USING ((EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = ( SELECT "plants"."household_id"
           FROM "public"."plants"
          WHERE ("plants"."id" = "care_log"."plant_id"))) AND ("household_members"."user_id" = "auth"."uid"()) AND ("household_members"."deleted_at" IS NULL)))));



CREATE POLICY "Members can manage plants in their households" ON "public"."plants" USING ((EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = "plants"."household_id") AND ("household_members"."user_id" = "auth"."uid"()) AND ("household_members"."deleted_at" IS NULL)))));



CREATE POLICY "Members can manage tasks in their households" ON "public"."tasks" USING ((EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = ( SELECT "plants"."household_id"
           FROM "public"."plants"
          WHERE ("plants"."id" = "tasks"."plant_id"))) AND ("household_members"."user_id" = "auth"."uid"()) AND ("household_members"."deleted_at" IS NULL)))));



CREATE POLICY "Members can update their own row" ON "public"."household_members" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Members can view members of their households" ON "public"."household_members" FOR SELECT USING (("household_id" IN ( SELECT "public"."get_my_household_ids"() AS "get_my_household_ids")));



CREATE POLICY "Members can view their households" ON "public"."households" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = "households"."id") AND ("household_members"."user_id" = "auth"."uid"()) AND ("household_members"."deleted_at" IS NULL)))));



ALTER TABLE "public"."care_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."household_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plant_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_my_household_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_household_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_household_ids"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."care_log" TO "anon";
GRANT ALL ON TABLE "public"."care_log" TO "authenticated";
GRANT ALL ON TABLE "public"."care_log" TO "service_role";



GRANT ALL ON TABLE "public"."household_members" TO "anon";
GRANT ALL ON TABLE "public"."household_members" TO "authenticated";
GRANT ALL ON TABLE "public"."household_members" TO "service_role";



GRANT ALL ON TABLE "public"."households" TO "anon";
GRANT ALL ON TABLE "public"."households" TO "authenticated";
GRANT ALL ON TABLE "public"."households" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."plant_photos" TO "anon";
GRANT ALL ON TABLE "public"."plant_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."plant_photos" TO "service_role";



GRANT ALL ON TABLE "public"."plants" TO "anon";
GRANT ALL ON TABLE "public"."plants" TO "authenticated";
GRANT ALL ON TABLE "public"."plants" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Authenticated users can delete photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'plant-photos'::text));



  create policy "Authenticated users can read photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'plant-photos'::text));



  create policy "Authenticated users can upload photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'plant-photos'::text));



  create policy "Members can delete photos in their households"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'plant-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.household_members
  WHERE ((household_members.household_id = ( SELECT plants.household_id
           FROM public.plants
          WHERE (plants.id = (split_part(objects.name, '/'::text, 1))::uuid))) AND (household_members.user_id = auth.uid()) AND (household_members.deleted_at IS NULL))))));



  create policy "Members can upload photos in their households"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'plant-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.household_members
  WHERE ((household_members.household_id = ( SELECT plants.household_id
           FROM public.plants
          WHERE (plants.id = (split_part(plants.name, '/'::text, 1))::uuid))) AND (household_members.user_id = auth.uid()) AND (household_members.deleted_at IS NULL))))));



  create policy "Members can view photos in their households"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'plant-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.household_members
  WHERE ((household_members.household_id = ( SELECT plants.household_id
           FROM public.plants
          WHERE (plants.id = (split_part(objects.name, '/'::text, 1))::uuid))) AND (household_members.user_id = auth.uid()) AND (household_members.deleted_at IS NULL))))));



