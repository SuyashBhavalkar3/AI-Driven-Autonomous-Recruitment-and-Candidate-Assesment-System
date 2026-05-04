"use client";

interface DLScores {
  dl_scores: Record<string, number>;
  maturity_band: string;
  overall_dl_score: number;
  authenticity_score: number;
  modality_contributions: { text: number; behavioral: number; task: number };
  model_used: string;
}

export function DLScoresCard({ scores }: { scores: DLScores }) {
  const scoreKeys = Object.keys(scores.dl_scores);
  const bandColors: Record<string, string> = {
    Elite: "text-green-600", Ready: "text-blue-600",
    Developing: "text-yellow-600", Emerging: "text-red-600",
  };

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Deep Learning Assessment</h3>
        <span className={`text-xl font-bold ${bandColors[scores.maturity_band] || ""}`}>
          {scores.maturity_band}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500 text-xs mb-1">DL Overall</div>
          <div className="font-bold text-lg">{scores.overall_dl_score}/100</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500 text-xs mb-1">Authenticity</div>
          <div className="font-bold text-lg">{scores.authenticity_score}/100</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500 text-xs mb-1">Model</div>
          <div className="font-semibold text-sm capitalize">
            {scores.model_used.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {scoreKeys.map((key) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{key.replace(/_/g, " ")}</span>
              <span className="font-medium">{scores.dl_scores[key]}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${scores.dl_scores[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <p className="text-xs text-gray-500 mb-2">Modality contributions</p>
        <div className="flex gap-4 text-xs">
          <span className="text-blue-600">Text {scores.modality_contributions.text}%</span>
          <span className="text-amber-600">Behavioral {scores.modality_contributions.behavioral}%</span>
          <span className="text-green-600">Task {scores.modality_contributions.task}%</span>
        </div>
      </div>
    </div>
  );
}