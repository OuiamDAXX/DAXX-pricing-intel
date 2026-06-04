@echo off
:: Batch script to automate daily run of OilChem Downloader
echo ==================================================
echo RUNNING DAILY OILCHEM DOWNLOADER
echo Date: %date% %time%
echo ==================================================

:: Move to the directory where the downloader script is located
cd /d "C:\Documents\A4\Satge\Prediction des prix\OilChem"

:: Run the python script
python "oilchem_downloader.py"

echo ==================================================
echo EXECUTION COMPLETE
echo ==================================================
pause
