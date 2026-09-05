import { TaskDefinition, MockRunResult } from "@/lib/types";

export interface EvaluationResult {
  qualityScore: number; // 0–100
  reasoningSummary: string;
  criteriaScores: Array<{ criterion: string; score: number; reasoning: string }>;
}

/**
 * AutoEvaluator uses rule-based and heuristic methods to evaluate run quality.
 * This runs without calling any external LLM.
 */
export class AutoEvaluator {
  async evaluate(task: TaskDefinition, result: MockRunResult): Promise<EvaluationResult> {
    if (result.status !== "completed") {
      return {
        qualityScore: 0,
        reasoningSummary: `Run did not complete successfully: ${result.error || "unknown error"}`,
        criteriaScores: task.evaluation_criteria.map((c) => ({
          criterion: c,
          score: 0,
          reasoning: "Run failed — criterion not evaluated",
        })),
      };
    }

    const criteriaScores = task.evaluation_criteria.map((criterion) => {
      const score = this.evaluateCriterion(criterion, result.answer, task);
      return {
        criterion,
        score,
        reasoning: this.generateReasoning(criterion, score),
      };
    });

    // Base quality score from criteria average
    const avgCriteriaScore =
      criteriaScores.reduce((sum, c) => sum + c.score, 0) / criteriaScores.length;

    // Bonus/penalty adjustments
    let qualityScore = avgCriteriaScore;

    // Tool call bonus: tasks with tools get bonus for successful tool use
    if (task.tools.length > 0 && result.toolCallsCount > 0) {
      const toolSuccessRate = result.successfulToolCalls / result.toolCallsCount;
      qualityScore += toolSuccessRate * 5;
    }

    // Answer length penalty: very short answers for complex tasks
    const minExpectedLength = this.getMinExpectedLength(task.difficulty);
    if (result.answer.length < minExpectedLength) {
      qualityScore -= 10;
    }

    // Cap and floor
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      qualityScore: Math.round(qualityScore),
      reasoningSummary: this.generateSummary(qualityScore, criteriaScores, task),
      criteriaScores,
    };
  }

  private evaluateCriterion(
    criterion: string,
    answer: string,
    task: TaskDefinition
  ): number {
    // Heuristic scoring based on keyword presence and answer structure
    const answerLower = answer.toLowerCase();
    let score = 60; // base score

    // Check for structural elements
    if (answer.includes("##") || answer.includes("###")) score += 5;
    if (answer.includes("1.") || answer.includes("- ")) score += 5;

    // Keyword matching from task context
    const taskKeywords = this.extractKeywords(task.input + task.description);
    const matchedKeywords = taskKeywords.filter((kw) => answerLower.includes(kw));
    const keywordScore = (matchedKeywords.length / Math.max(taskKeywords.length, 1)) * 20;
    score += keywordScore;

    // Criterion-specific heuristics
    if (criterion.toLowerCase().includes("completude") || criterion.toLowerCase().includes("completo")) {
      score += answer.length > 500 ? 5 : -5;
    }
    if (criterion.toLowerCase().includes("clareza")) {
      score += answer.includes("\n") ? 3 : 0;
    }
    if (criterion.toLowerCase().includes("ferramenta") || criterion.toLowerCase().includes("tool")) {
      // Will be adjusted based on tool results
      score += task.tools.length > 0 ? 5 : 0;
    }

    // Add random variation to simulate real evaluation variance (±8 points)
    score += (Math.random() - 0.5) * 16;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(["o", "a", "e", "de", "do", "da", "em", "para", "com", "um", "uma", "que", "por", "se"]);
    return text
      .toLowerCase()
      .replace(/[^a-záéíóúâêîôûãõ\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !stopWords.has(w))
      .slice(0, 20);
  }

  private getMinExpectedLength(difficulty: string): number {
    const lengths: Record<string, number> = {
      facil: 200,
      medio: 400,
      dificil: 600,
      muito_dificil: 800,
    };
    return lengths[difficulty] || 300;
  }

  private generateReasoning(criterion: string, score: number): string {
    if (score >= 80) return `Criterion met with high quality. ${criterion} was addressed thoroughly.`;
    if (score >= 60) return `Criterion partially met. ${criterion} was addressed but could be more comprehensive.`;
    if (score >= 40) return `Criterion weakly addressed. ${criterion} needs significant improvement.`;
    return `Criterion not met. ${criterion} was absent or insufficient in the response.`;
  }

  private generateSummary(
    qualityScore: number,
    criteriaScores: Array<{ criterion: string; score: number; reasoning: string }>,
    task: TaskDefinition
  ): string {
    const avgScore = qualityScore;
    const weakCriteria = criteriaScores.filter((c) => c.score < 60).map((c) => c.criterion);

    let summary = `Auto-evaluation for task ${task.id} (${task.title}). `;
    summary += `Overall quality score: ${avgScore}/100. `;

    if (weakCriteria.length === 0) {
      summary += "All evaluation criteria were satisfactorily addressed.";
    } else {
      summary += `Weak areas: ${weakCriteria.slice(0, 3).join("; ")}.`;
    }

    return summary;
  }
}
