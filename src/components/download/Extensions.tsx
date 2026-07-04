import React from "react";
import { Download } from "lucide-react";
import AppCatalog from "@/components/download/AppCatalog";
import { installCatalog, INSTALL_URL } from "@/data/app-catalog";

const Extensions = () => (
  <AppCatalog
    id="extensions"
    title="Install Hanzo everywhere you work"
    subtitle="One extension bundle — sign in once with your Hanzo account and it works across every browser, editor, and app below."
    groups={installCatalog}
    actionLabel="Install"
    actionHref={INSTALL_URL}
    ActionIcon={Download}
  />
);

export default Extensions;
