import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { AppEntry, AppGroup } from "@/data/app-catalog";

interface AppCatalogProps {
  id?: string;
  title: string;
  subtitle: string;
  groups: AppGroup[];
  /** Verb shown on every card action (e.g. "Install", "Connect"). */
  actionLabel: string;
  /** Destination for every card action (releases for install, docs for connect). */
  actionHref: string;
  /** Icon rendered next to the section title. */
  ActionIcon: LucideIcon;
}

const AppCard: React.FC<{ app: AppEntry; actionLabel: string; actionHref: string }> = ({
  app,
  actionLabel,
  actionHref,
}) => {
  const Icon = app.icon;
  return (
    <a
      href={actionHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${actionLabel} ${app.name}`}
      className="group flex h-full flex-col rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-colors hover:border-purple-500/50 hover:bg-gray-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-8 w-8 flex-shrink-0 text-purple-400" aria-hidden="true" />
        <h4 className="text-lg font-semibold text-[var(--white)]">{app.name}</h4>
      </div>
      <p className="mb-6 text-sm text-neutral-400">{app.blurb}</p>
      <span className="mt-auto inline-flex items-center text-sm font-medium text-purple-400 group-hover:text-purple-300">
        {actionLabel}
        <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  );
};

const AppCatalog: React.FC<AppCatalogProps> = ({
  id,
  title,
  subtitle,
  groups,
  actionLabel,
  actionHref,
  ActionIcon,
}) => {
  return (
    <section id={id} className="px-4 py-20 sm:px-6 lg:px-8 bg-[var(--black)]/50">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <ActionIcon className="h-8 w-8 text-purple-500" aria-hidden="true" />
            <h2 className="text-3xl font-bold text-[var(--white)] sm:text-4xl">{title}</h2>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-neutral-300">{subtitle}</p>
        </motion.div>

        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.apps.map((app) => (
                  <AppCard
                    key={app.name}
                    app={app}
                    actionLabel={actionLabel}
                    actionHref={actionHref}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppCatalog;
