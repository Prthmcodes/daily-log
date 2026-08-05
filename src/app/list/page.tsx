import { redirect } from "next/navigation";

import { ListScreen } from "@/components/list-screen";
import { MORNING_LIST, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * The morning list, on its own route.
 *
 * Separate from the today screen on purpose. The list has its own table, its
 * own screen and no connection to the score — a day with an empty list and
 * five marks is a five, and a day with ten ticked tasks and no marks is a
 * zero. Keeping them apart in the routing as well makes that harder to undo
 * by accident.
 *
 * Note what is absent from this page: the reframe banner, the protocol, the
 * numbers and the grid. None of them belongs to the list, and putting any of
 * them here would start to imply the list feeds into them.
 */
export default async function ListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-6">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
        {UI.appTitle}
      </h1>
      <p className="mb-[22px] text-[13px] text-muted">{MORNING_LIST.heading}</p>

      <ListScreen userId={user.id} />
    </main>
  );
}
