import { Severity } from '../../shared/common.interfaces'

export interface ISnackBar {
    message: string
    severity: Severity
    dismiss?: boolean
}
