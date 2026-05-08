$repo = "ShayCerny/Chess-Mate"
$label = "ready-for-agent"
$dir = "$PSScriptRoot"

$issues = @(
    @{ title = "Deselect fix: clear move highlights on deselection";                              file = "01-deselect-fix.md" },
    @{ title = "Turn indicator and board glow for active player";                                 file = "02-turn-indicator.md" },
    @{ title = "Check feedback: king highlight, sidebar message, and isInCheck engine endpoint";  file = "03-check-feedback.md" },
    @{ title = "Game result state and board locking on checkmate/stalemate";                      file = "04-game-result-state.md" },
    @{ title = "Game-end modal for checkmate and stalemate";                                      file = "05-game-end-modal.md" },
    @{ title = "Redo stack with disabled-state buttons";                                          file = "06-redo-stack.md" },
    @{ title = "Resign confirmation and Offer Draw";                                              file = "07-resign-and-draw.md" }
)

foreach ($issue in $issues) {
    Write-Host "Creating: $($issue.title)"
    gh issue create --repo $repo --label $label --title $issue.title --body-file "$dir\$($issue.file)"
}
