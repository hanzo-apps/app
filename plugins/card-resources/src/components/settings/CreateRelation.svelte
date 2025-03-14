<script lang="ts">
  import contact from '@hanzo/contact'
  import { Class, Doc, Ref } from '@hanzo/core'
  import { getClient } from '@hanzo/presentation'
  import { CreateRelation } from '@hanzo/setting-resources'
  import card from '../../plugin'

  export let aClass: Ref<Class<Doc>> | undefined = undefined

  const client = getClient()
  const hierarchy = client.getHierarchy()
  const _classes = [...hierarchy.getDescendants(card.class.Card), contact.class.Contact].filter(
    (c) => c !== card.class.Card
  )
</script>

<CreateRelation {aClass} {_classes} exclude={[]} on:close />
