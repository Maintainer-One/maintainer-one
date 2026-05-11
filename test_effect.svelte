<script>
    let teamCodes = $state({ A: 'initial' });
    let override = $state('override');

    $effect(() => {
        if (teamCodes.A !== override) {
            console.log("Reverting teamCodes.A from", teamCodes.A, "to", override);
            teamCodes.A = override;
        }
    });

    function change() {
        teamCodes.A = 'changed';
    }
</script>
<button onclick={change}>Change</button>
{teamCodes.A}
