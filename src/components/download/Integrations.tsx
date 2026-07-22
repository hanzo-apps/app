import React from "react";
import { Plug } from "lucide-react";
import AppCatalog from "@/components/download/AppCatalog";
import { connectCatalog, CONNECT_URL } from "@/data/app-catalog";

const Integrations = () => (
  <AppCatalog
    id="integrations"
    title="Connect your apps & data"
    subtitle="OAuth-connect the tools your team already uses. Every connected app runs through the same Hanzo gateway and identity."
    groups={connectCatalog}
    actionLabel="Connect"
    actionHref={CONNECT_URL}
    ActionIcon={Plug}
  />
);

export default Integrations;
