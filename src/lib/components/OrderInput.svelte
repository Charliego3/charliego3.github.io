<script lang="ts">
    interface NumberInputProps {
        title: string;
        unit: string | undefined;
        value: unknown;
        placeholder: unknown;
    }
    import * as InputGroup from "$lib/components/ui/input-group/index.js";

    let {
        title = "Price",
        unit = "USDC",
        value = $bindable(),
        placeholder = $bindable(0),
    }: NumberInputProps = $props();
</script>

<InputGroup.Root>
    <InputGroup.Addon>
        <InputGroup.Text class="text-xs">{title}</InputGroup.Text>
    </InputGroup.Addon>
    <InputGroup.Input type="number" bind:value={value} placeholder={String(placeholder)} class="text-right ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"></InputGroup.Input>
    <InputGroup.Addon align="inline-end" class="w-9 text-right">
        <InputGroup.Text class="text-xs">{unit}</InputGroup.Text>
    </InputGroup.Addon>
</InputGroup.Root>
