How to create a workspace backup

Run the included PowerShell script to create a timestamped copy of your workspace.

From PowerShell:

```powershell
# default paths
cd D:\REACT-Workspace\scripts
.\backup-workspace.ps1

# or specify custom source and destination root
.\backup-workspace.ps1 -Source "D:\REACT-Workspace" -DestRoot "D:\Backups\REACT"
```

Notes:
- The script will copy files recursively and may take time depending on project size.
- Backups are stored under `$env:USERPROFILE\REACT-Workspace-backups` by default.
- You can restore by copying files back from the created backup folder.
