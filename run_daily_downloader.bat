@echo off
:: Batch script to automate daily run of OilChem Downloader
echo ==================================================
echo RUNNING DAILY OILCHEM DOWNLOADER
echo Date: %date% %time%
echo ==================================================

:: Move to the directory where the downloader script is located
cd /d "C:\Documents\A4\Satge\Prediction des prix\OilChem"

:: Run the python script pipeline
python "oilchem_downloader.py"
python "data_preprocessing.py"
python "lead_lag_analysis.py"
python "financial_prediction.py"

echo ==================================================
echo EXECUTION COMPLETE
echo ==================================================
pause
