## 4. Results and Evaluation

This section presents the quantified algorithmic analysis of the proposed multimodal Deep Learning engine. The system was evaluated across its three core architectural components: Semantic Analysis (DeBERTa-v3), Behavioral Integrity (BiLSTM), and Multimodal Fusion.

### 4.1 Dataset and Experimental Setup
The models were trained and validated on an internal augmented dataset (`augmented_train.jsonl`). The dataset was partitioned using an 85/15 train-validation split. The primary evaluation metric for the regression tasks is Mean Absolute Error (MAE) scaled from 0 to 100, where a lower score indicates higher predictive alignment with human recruiter baselines.

### 4.2 Semantic Analysis Performance (DeBERTa-v3-small)
The natural language understanding core utilizes a fine-tuned `microsoft/deberta-v3-small` backbone (~143 Million parameters, 6 layers, 768 hidden units). The model was augmented with 8 parallel regression heads to predict candidate traits (e.g., Initiative, Accountability, Reliability).

*   **Validation MAE**: After initial fine-tuning (Epoch 4), the model achieved a Validation MAE of **25.33**. 
*   **Confidence Estimation**: To ensure reliability, the model implements Monte Carlo (MC) Dropout (10 stochastic forward passes during inference). This yields a 95% Confidence Interval ($\pm 1.96 \sigma$) for every predicted trait, quantifying the model's epistemic uncertainty.

### 4.3 Behavioral Integrity Verification (BiLSTM)
Candidate authenticity and proctoring events were processed through a Bidirectional Long Short-Term Memory (BiLSTM) network. 

*   **Algorithmic Complexity**: The model operates with approximately **650,000 parameters**, processing temporal sequences of up to 50 behavioral events (e.g., tab switches, copy-paste actions).
*   **Performance Objective**: The BiLSTM computes an *Authenticity Score* (0-100%). It is trained using a Binary Cross-Entropy (BCE) loss function against weakly supervised labels derived from extreme behavioral anomalies.

### 4.4 Multimodal Fusion Optimization
The ultimate candidate verdict is generated via a `MultimodalFusionNet` (~850,000 parameters) which applies cross-attention weighted summation over the textual embeddings, behavioral embeddings, and quantitative assessment scores. 

Through backpropagation, the model converged on the following optimal modality contributions for the final Maturity Index calculation:
*   **Textual Modality (DeBERTa)**: 70.0%
*   **Behavioral Modality (BiLSTM)**: 20.0%
*   **Task Performance (Coding/MCQ)**: 10.0%

### 4.5 Summary of Algorithmic Complexity

Table 1 summarizes the architectural footprint and computational complexity of the deployed recruitment engine.

**Table 1: Architectural Parameters and Complexity**
| Sub-System | Base Architecture | Total Parameters | Primary Metric |
| :--- | :--- | :--- | :--- |
| **Trait Scorer** | DeBERTa-v3-small | ~143,000,000 | Validation MAE (25.33) |
| **Authenticity Scorer** | BiLSTM | ~650,000 | Binary Cross-Entropy |
| **Decision Fusion** | Cross-Attention Net | ~850,000 | MSE / Validation Loss |

The relatively low parameter count of the combined architecture allows the system to perform asynchronous, real-time evaluations (inference latency $< 300$ms) without relying on massive LLMs for structured numerical scoring, proving highly efficient for production deployment.
