import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Link2, Plus, ShieldCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShareLinkCard } from "@/features/share/ShareLinkCard";
import { useShareLinks } from "@/hooks/useShareLinks";
import { useDataStore } from "@/store/dataStore";
import type { DataroomOutletContext } from "@/pages/types";

export default function SharesView() {
  const { dataroom, openShareDialog } = useOutletContext<DataroomOutletContext>();
  const { links, activeCount } = useShareLinks();
  const foldersById = useDataStore((s) => s.foldersById);
  const { revokeShareLink, deleteShareLink } = useDataStore(
    useShallow((s) => ({
      revokeShareLink: s.revokeShareLink,
      deleteShareLink: s.deleteShareLink,
    })),
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 pl-12 sm:px-6 md:pl-6">
        <PageHeader
          icon={Link2}
          title="Share links"
          description={
            links.length === 0
              ? `Hand out scoped access to ${dataroom.name}.`
              : `${activeCount} active of ${links.length} created.`
          }
          actions={
            <Button variant="brand" size="sm" onClick={() => openShareDialog(null)}>
              <Plus aria-hidden />
              New link
            </Button>
          }
        />

        {links.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              icon={ShieldCheck}
              title="No links yet"
              description="A share link gives read access to the whole room or a single folder, with an expiry date, an optional passcode, and download and watermark policy."
              action={
                <Button variant="brand" onClick={() => openShareDialog(null)}>
                  <Plus aria-hidden />
                  Create the first link
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pt-5">
            {links.map((link) => (
              <ShareLinkCard
                key={link.id}
                link={link}
                folderName={link.folderId ? foldersById[link.folderId]?.name ?? "Deleted folder" : null}
                onRevoke={(id) => {
                  revokeShareLink(id)
                    .then(() => toast.success("Link revoked"))
                    .catch(() => toast.error("Couldn't revoke the link"));
                }}
                onDelete={(id) => {
                  deleteShareLink(id)
                    .then(() => toast.success("Link deleted"))
                    .catch(() => toast.error("Couldn't delete the link"));
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
