"use client";

import { Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PARTICIPANT_RELATIONSHIPS,
  type Participant,
  type ParticipantRelationship,
} from "@/lib/meeting-prep/types";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface ParticipantRowProps {
  index: number;
  participant: Participant;
  onChange: (patch: Partial<Participant>) => void;
  onRemove: () => void;
}

export function ParticipantRow({
  index,
  participant,
  onChange,
  onRemove,
}: ParticipantRowProps) {
  const t = useT();

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          #{index + 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          {t("meeting_prep.participants.remove")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`p-${participant.id}-name`}>
            {t("meeting_prep.participant.name")}
          </Label>
          <Input
            id={`p-${participant.id}-name`}
            value={participant.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t("meeting_prep.participant.name_placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`p-${participant.id}-role`}>
            {t("meeting_prep.participant.role")}
          </Label>
          <Input
            id={`p-${participant.id}-role`}
            value={participant.role}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder={t("meeting_prep.participant.role_placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`p-${participant.id}-org`}>
            {t("meeting_prep.participant.organization")}
          </Label>
          <Input
            id={`p-${participant.id}-org`}
            value={participant.organization}
            onChange={(e) => onChange({ organization: e.target.value })}
            placeholder={t("meeting_prep.participant.organization_placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`p-${participant.id}-rel`}>
            {t("meeting_prep.participant.relationship")}
          </Label>
          <Select
            value={participant.relationship ?? ""}
            onValueChange={(v) =>
              onChange({ relationship: v as ParticipantRelationship })
            }
          >
            <SelectTrigger id={`p-${participant.id}-rel`}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {PARTICIPANT_RELATIONSHIPS.map((rel) => (
                <SelectItem key={rel} value={rel}>
                  {t(`meeting_prep.relationship.${rel}` as MessageKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`p-${participant.id}-notes`}>
          {t("meeting_prep.participant.profile_notes")}
        </Label>
        <Textarea
          id={`p-${participant.id}-notes`}
          rows={2}
          value={participant.profileNotes}
          onChange={(e) => onChange({ profileNotes: e.target.value })}
          placeholder={t(
            "meeting_prep.participant.profile_notes_placeholder",
          )}
        />
      </div>
    </div>
  );
}
