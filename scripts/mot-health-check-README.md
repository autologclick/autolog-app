# MOT API Health Check — Scheduled Task (Windows)

המשימה הזו מחליפה את ה-scheduled task של Cowork שרץ בתוך ה-sandbox ולא מצליח לאמת חיים בגלל חסימות רשת. במקום זה המשימה רצה ישירות על ה-Windows שלך, שם יש גישה גם ל-`localhost:3000` וגם ל-`data.gov.il`.

## הקבצים בתיקייה

- `mot-health-check.bat` — הסקריפט שעושה את כל העבודה (מוודא ששרת ה-Next.js חי, קורא ל-endpoint, מפרסר JSON, וכותב ללוג).
- `mot-health-check.xml` — הגדרת המשימה ל-Windows Task Scheduler, מוכנה ל-import.
- `mot-health-check-README.md` — המסמך הזה.

לוגים נכתבים ל-`C:\Users\User\AutoLog\autolog-app\logs\mot-health\mot-health-YYYY-MM-DD.log`. כל הרצה מוסיפה בלוק חדש באותו קובץ יומי, כך שתוכל לראות היסטוריה רצופה.

## התקנה חד-פעמית

פתח PowerShell **כמנהל מערכת** והרץ:

```powershell
schtasks /Create /XML "C:\Users\User\AutoLog\autolog-app\scripts\mot-health-check.xml" /TN "AutoLog\mot-api-health-check"
```

אם המשימה כבר קיימת ואתה רוצה להחליף:

```powershell
schtasks /Create /XML "C:\Users\User\AutoLog\autolog-app\scripts\mot-health-check.xml" /TN "AutoLog\mot-api-health-check" /F
```

לבדיקה שהמשימה נוצרה:

```powershell
schtasks /Query /TN "AutoLog\mot-api-health-check" /V /FO LIST
```

## הרצה ידנית

```powershell
schtasks /Run /TN "AutoLog\mot-api-health-check"
```

או מ-CMD רגיל (בלי Task Scheduler), ישירות:

```cmd
C:\Users\User\AutoLog\autolog-app\scripts\mot-health-check.bat
```

אחרי ההרצה, הצצה בלוג האחרון:

```powershell
Get-Content (Get-ChildItem "C:\Users\User\AutoLog\autolog-app\logs\mot-health\*.log" | Sort LastWriteTime | Select -Last 1) -Tail 40
```

## זמן ההרצה

ברירת המחדל ב-XML היא יומי ב-09:00. אם תרצה שעה אחרת — ערוך את `<StartBoundary>` או החלף דרך ה-UI: Task Scheduler → AutoLog → mot-api-health-check → Triggers → Edit.

## קודי יציאה

| Exit code | משמעות |
|-----------|---------|
| 0 | status=ok — ה-API תקין, אין פעולה נדרשת |
| 1 | status=updated — Resource ID הוחלף אוטומטית לחלופי מהרשימה |
| 2 | status=discovered — Resource ID חדש התגלה דרך CKAN ונשמר |
| 3 | status=error — ה-API נפל לחלוטין, נדרשת פעולה ידנית |
| 4 | שרת Next.js לא עלה תוך 90 שניות |
| 5 | תגובה לא צפויה/לא נפרסה מה-endpoint |

Task Scheduler יסמן הרצות עם exit code ≠ 0 כ-"Last Run Result" שאינו 0x0, כך שקל לזהות אותן בהיסטוריה.

## הפסקת המשימה הישנה ב-Cowork

המשימה הישנה, זו שרצה ב-sandbox של Cowork, ממשיכה לייצר דוחות `mot-health-report-YYYY-MM-DD.md` עם אותה תוצאה של "לא ניתן לאמת חיים". כדי לעצור אותה:

1. פתח את Cowork.
2. עבור ל-Scheduled Tasks.
3. מצא את `mot-api-health-check`.
4. השבת אותה (Disable) או מחק.

אחרי ההשבתה, הדיווחים היחידים יגיעו מהמשימה שרצה מקומית ב-Windows, דרך הלוגים ב-`logs\mot-health`.

## וידוא מהיר אחרי ההתקנה

1. הרץ ידנית: `schtasks /Run /TN "AutoLog\mot-api-health-check"`
2. המתן 60-120 שניות (אם השרת לא היה למעלה, צריך זמן עלייה).
3. פתח את הלוג האחרון ב-`logs\mot-health`. שורה `[parsed] status=ok` = הצלחה.
4. אם ה-status הוא `updated` או `discovered`, בדוק את `mot-api-config.json` ב-root — ה-Resource ID החדש אמור להיות שמור שם.
