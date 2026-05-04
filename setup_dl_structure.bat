@echo off
echo Creating Deep Learning Backend Structure...

REM Root backend folder (assumes you're inside project root)
mkdir backend
cd backend

REM ==============================
REM DL ENGINE
REM ==============================
mkdir dl_engine
cd dl_engine

mkdir models
mkdir models\deberta_scorer

type nul > __init__.py

REM Model files
type nul > models\deberta_scorer\config.json
type nul > models\deberta_scorer\tokenizer_config.json
type nul > models\deberta_scorer\sentencepiece.bpe.model
type nul > models\deberta_scorer\heads.pt
type nul > models\bilstm_behavioral.pt
type nul > models\fusion_net.pt

REM Core DL files
type nul > deberta_scorer.py
type nul > bilstm_behavioral.py
type nul > multimodal_fusion.py
type nul > dl_pipeline.py
type nul > event_processor.py
type nul > routes.py
type nul > schemas.py

cd ..

REM ==============================
REM SCRIPTS
REM ==============================
mkdir scripts
cd scripts

type nul > create_seed_data.py
type nul > augment_data.py
type nul > train_bilstm.py
type nul > train_deberta_scorer.py
type nul > train_fusion.py

cd ..

REM ==============================
REM DATA
REM ==============================
mkdir data
cd data

type nul > labeled_responses.jsonl
type nul > augmented_train.jsonl

cd ..

REM ==============================
REM MAIN MODIFICATIONS FILES
REM ==============================
type nul > main.py

mkdir applications
type nul > applications\models.py

mkdir proctoring
type nul > proctoring\routes.py

mkdir reports
type nul > reports\service.py

type nul > requirements.txt

echo.
echo ✅ Folder structure created successfully!
pause