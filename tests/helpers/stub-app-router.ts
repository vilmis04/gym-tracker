import { usePathname, useRouter } from "next/navigation";
import { vi } from "vitest";

/**
 * Puts a component under test "at" `url` for the App Router hooks: the
 * browser URL (`window.location`, for the query), `usePathname()` and a
 * `useRouter()` whose `replace` is a spy. The test file must mock the hooks
 * first, keeping the rest of the module (next-intl's navigation needs its
 * `redirect`):
 *
 * vi.mock(import("next/navigation"), async (importOriginal) => ({
 *   ...(await importOriginal()),
 *   usePathname: vi.fn(),
 *   useRouter: vi.fn(),
 * }));
 */
export function stubAppRouterAt(url: string) {
  const replace = vi.fn();
  window.history.replaceState(null, "", url);
  vi.mocked(usePathname).mockReturnValue(window.location.pathname);
  vi.mocked(useRouter).mockReturnValue({
    replace,
  } as unknown as ReturnType<typeof useRouter>);
  return { replace };
}
