@echo off
echo Setter opp gemma_coder...
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo.
echo Ferdig! Start verktøyet med:
echo   venv\Scripts\activate
echo   python agent.py status
pause
