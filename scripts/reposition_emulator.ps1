# scripts/reposition_emulator.ps1
# Posiciona la ventana del emulador de Android de forma automatica en X=250, Y=140

$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinPositioner {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
"@

if (-not ([System.Management.Automation.PSTypeName]'WinPositioner').Type) {
    Add-Type -TypeDefinition $code -Language CSharp
}

$targetX = 250
$targetY = 140
$swpFlags = 0x0001 -bor 0x0004 # SWP_NOSIZE | SWP_NOZORDER

$timeout = (Get-Date).AddSeconds(15)
$moved = $false

while ((Get-Date) -lt $timeout -and -not $moved) {
    $processes = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like "*qemu*" -or $_.ProcessName -like "*emulator*" }
    foreach ($proc in $processes) {
        $pId = [uint32]$proc.Id
        [WinPositioner]::EnumWindows({
            param($hWnd, $lParam)
            $winPid = [uint32]0
            [WinPositioner]::GetWindowThreadProcessId($hWnd, [ref]$winPid) | Out-Null
            if ($winPid -eq $using:pId -and [WinPositioner]::IsWindowVisible($hWnd)) {
                $sb = New-Object System.Text.StringBuilder 256
                [WinPositioner]::GetWindowText($hWnd, $sb, 256) | Out-Null
                $title = $sb.ToString()
                if ($title -like "*Android Emulator*" -or $title -like "*Medium*" -or $title.Length -gt 0) {
                    [WinPositioner]::SetWindowPos($hWnd, [IntPtr]::Zero, $using:targetX, $using:targetY, 0, 0, $using:swpFlags) | Out-Null
                    $script:moved = $true
                }
            }
            return $true
        }, [IntPtr]::Zero) | Out-Null
    }
    if (-not $moved) {
        Start-Sleep -Milliseconds 600
    }
}

