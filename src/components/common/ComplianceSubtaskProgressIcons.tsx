import React from "react";
import { ComplianceItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { getComplianceFourColorStatus, getComplianceStuckInfo } from "../../utils/statusColors";
import { formatDueDate } from "../../utils/dueDate";
import { Check, AlertCircle, AlertTriangle, ChevronRight, UserCheck, Calendar } from "lucide-react";

interface ComplianceSubtaskProgressIconsProps {
  compliance: ComplianceItem;
  compact?: boolean;
}

export const ComplianceSubtaskProgressIcons: React.FC<ComplianceSubtaskProgressIconsProps> = ({
  compliance,
  compact = false,
}) => {
  const { userAccounts, clientProfile } = useApp();
  const status = getComplianceFourColorStatus(compliance);
  const stuckInfo = getComplianceStuckInfo(compliance);
  const subtasks = compliance.subtasks || [];

  const defaultTeamPerson =
    userAccounts.find((u) => u.role === "client_team")?.name ||
    userAccounts[0]?.name ||
    "Finance Team";
  const defaultCfoPerson =
    clientProfile?.assignedCfo ||
    clientProfile?.cfoName ||
    userAccounts.find((u) => u.role === "cfo")?.name ||
    "Virtual CFO";

  const stageIcons = [
    {
      num: 1,
      name: "S1",
      fullName: "Subtask 1 (Draft)",
      assignee: subtasks[0]?.assignedTo || defaultTeamPerson,
      deadline: subtasks[0]?.deadline || subtasks[0]?.dueDate || "",
    },
    {
      num: 2,
      name: "S2",
      fullName: "Subtask 2 (CFO Review)",
      assignee: subtasks[1]?.assignedTo || defaultCfoPerson,
      deadline: subtasks[1]?.deadline || subtasks[1]?.dueDate || "",
    },
    {
      num: 3,
      name: "S3",
      fullName: "Subtask 3 (Filing)",
      assignee: subtasks[2]?.assignedTo || defaultTeamPerson,
      deadline: subtasks[2]?.deadline || subtasks[2]?.dueDate || "",
    },
  ];

  const primaryOwner = compliance.assignedTo || subtasks[0]?.assignedTo || defaultTeamPerson;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 leading-none"
        onClick={(e) => e.stopPropagation()}
        title={
          stuckInfo.isStuck
            ? `Stuck at Subtask ${stuckInfo.stepNumber}: ${stuckInfo.assignee}`
            : "Subtasks"
        }
      >
        <div className="flex items-center gap-0.5 shrink-0">
          {stageIcons.map((step, idx) => {
            const st = subtasks[idx];
            const isDone = st && st.status === "completed";
            const isStuckHere = stuckInfo.isStuck && stuckInfo.stepNumber === step.num;
            let iconContainerClasses =
              "w-3.5 h-3.5 rounded flex items-center justify-center text-[8.5px] font-semibold shrink-0 ";
            let iconElement = null;

            if (isDone) {
              iconContainerClasses += "bg-emerald-600 text-white";
              iconElement = <Check className="w-2 h-2 stroke-[2.5]" />;
            } else if (isStuckHere) {
              if (status === "overdue") {
                iconContainerClasses += "bg-rose-600 text-white";
                iconElement = <AlertTriangle className="w-2 h-2 stroke-[2]" />;
              } else {
                iconContainerClasses += "bg-amber-500 text-white";
                iconElement = <AlertCircle className="w-2 h-2 stroke-[2]" />;
              }
            } else {
              iconContainerClasses += "bg-slate-200 text-slate-600";
              iconElement = <span>{step.num}</span>;
            }

            return (
              <React.Fragment key={step.num}>
                <div
                  className={iconContainerClasses}
                  title={`${step.fullName} • ${step.assignee} • ${isDone ? "Completed" : "Pending"}`}
                >
                  {iconElement}
                </div>
                {idx < stageIcons.length - 1 && (
                  <ChevronRight className="w-2 h-2 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Short inline status pill */}
        <span
          className={`text-[9px] font-medium truncate max-w-[130px] ${
            status === "completed"
              ? "text-emerald-700"
              : status === "overdue"
                ? "text-rose-700 font-semibold"
                : status === "in_process"
                  ? "text-amber-700"
                  : "text-slate-500"
          }`}
        >
          {status === "completed"
            ? "Completed ✓"
            : status === "overdue"
              ? `Stuck at S${stuckInfo.stepNumber}${stuckInfo.assignee ? ` (${stuckInfo.assignee.split(" ")[0]})` : ""}`
              : status === "in_process"
                ? `In Process (${stuckInfo.assignee ? stuckInfo.assignee.split(" ")[0] : `S${stuckInfo.stepNumber}`})`
                : "Not due"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-0" onClick={(e) => e.stopPropagation()}>
      {/* Primary Compliance Assignee (Clean unbordered text) */}
      {!compact && (
        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
          <span
            className="inline-flex items-center gap-1 text-indigo-700 font-semibold"
            title={`Compliance assigned to: ${primaryOwner} (${compliance.assignedToRole || compliance.assignedRole || "Lead"})`}
          >
            <UserCheck className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[140px]">{primaryOwner}</span>
          </span>
        </div>
      )}

      {/* 3 Step Visual Pipeline with Subtask Icons, Individual Assignee & Target Date */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {stageIcons.map((step, idx) => {
          const st = subtasks[idx];
          const isDone = st && st.status === "completed";
          const isStuckHere = stuckInfo.isStuck && stuckInfo.stepNumber === step.num;
          const shortPerson = step.assignee
            .replace(/^CA\s+/i, "CA ")
            .split(" ")
            .slice(0, 2)
            .join(" ");
          const formattedDate = step.deadline ? formatDueDate(step.deadline) : "";

          let iconContainerClasses =
            "w-4 h-4 rounded flex items-center justify-center transition-colors text-[9px] shrink-0 ";
          let iconElement = null;

          if (isDone) {
            iconContainerClasses += "bg-emerald-600 text-white";
            iconElement = <Check className="w-2.5 h-2.5 stroke-[2.5]" />;
          } else if (isStuckHere) {
            if (status === "overdue") {
              iconContainerClasses += "bg-rose-600 text-white";
              iconElement = <AlertTriangle className="w-2.5 h-2.5 stroke-[2]" />;
            } else {
              iconContainerClasses += "bg-amber-500 text-white";
              iconElement = <AlertCircle className="w-2.5 h-2.5 stroke-[2]" />;
            }
          } else {
            iconContainerClasses += "bg-slate-200/80 text-slate-600";
            iconElement = <span className="text-[9px] font-semibold">{step.num}</span>;
          }

          return (
            <React.Fragment key={step.num}>
              <div
                className="group relative flex items-center gap-1 py-0.5"
                title={`${step.fullName} • Assigned to: ${step.assignee}${formattedDate ? ` • Target Date: ${formattedDate}` : ""} • Status: ${isDone ? "Completed" : isStuckHere ? "Active / Stuck here" : "Pending"}`}
              >
                <div className={iconContainerClasses}>{iconElement}</div>

                {!compact && (
                  <span className="text-[10px] font-normal leading-none text-slate-700 truncate max-w-[110px]">
                    {shortPerson}
                    {formattedDate && (
                      <span className="font-mono text-slate-500 ml-1">
                        ({formattedDate.split(" ").slice(0, 2).join(" ")})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {idx < stageIcons.length - 1 && (
                <ChevronRight
                  className={`w-2.5 h-2.5 shrink-0 ${
                    subtasks[idx]?.status === "completed" ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Simple and Crisp Bottleneck Status (Where Stuck) */}
      <div className="text-[10.5px] leading-tight font-normal text-slate-700">
        {status === "completed" && (
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-600 shrink-0"></span>
            <span>All subtasks completed</span>
          </div>
        )}

        {status === "overdue" && (
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
            <span>
              Stuck at Subtask {stuckInfo.stepNumber}
              {stuckInfo.assignee ? ` (${stuckInfo.assignee})` : ""}
            </span>
          </div>
        )}

        {status === "in_process" && (
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
            <span>
              Stuck at Subtask {stuckInfo.stepNumber}
              {stuckInfo.assignee ? ` • ${stuckInfo.assignee}` : ""}
            </span>
          </div>
        )}

        {status === "not_due" && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
            <span>Not due currently</span>
          </div>
        )}
      </div>
    </div>
  );
};
