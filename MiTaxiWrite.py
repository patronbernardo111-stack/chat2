# MiTaxi writer script
lines = []
lines.append('')
lines.append('interface Props {')
lines.append('  onBack: () => void;')
lines.append('  userBalance: number;')
lines.append('  onDebit: (amount: number) => void;')
lines.append('  userName?: string;')
lines.append('  userPhone?: string;')
lines.append('}')
