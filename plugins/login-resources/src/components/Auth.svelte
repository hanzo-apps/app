<script lang="ts">
  import { Loading } from '@hanzo/ui'
  import { logIn } from '@hanzo/workbench'
  import { onMount } from 'svelte'

  import { afterConfirm, getLoginInfoFromQuery, goTo, isWorkspaceLoginInfo, navigateToWorkspace } from '../utils'

  onMount(async () => {
    const result = await getLoginInfoFromQuery()

    if (result != null) {
      await logIn(result)

      if (isWorkspaceLoginInfo(result)) {
        navigateToWorkspace(result.workspaceUrl, result, undefined, true)
        return
      }

      await afterConfirm(true)
    } else {
      goTo('login', true)
    }
  })
</script>

<Loading />
