export interface ISnackBar {
    message: string
    action: string
    severity: 'error' | 'warning' | 'info'
}