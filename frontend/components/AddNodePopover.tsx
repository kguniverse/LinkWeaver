"use client"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

const formSchema = z.object({
    name: z.string().min(1, "Node name is required"),
    type: z.enum(["Person", "Organization", "Bank Account"], {
        message: "Node type must be one of Person, Organization, Location, or Event",
    }),
    attributes: z.string().optional(),
});

function AddNodeForm() {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "Person",
            attributes: "",
        },
    })

    function onSubmit(data: z.infer<typeof formSchema>) {
        console.log(data);
        // TODO: Add logic to create a new node in the graph
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Node Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter node name" {...field} />
                            </FormControl>
                            <FormDescription>
                                The name of the node to be added to the graph.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Node Type</FormLabel>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select node type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Person">Person</SelectItem>
                                        <SelectItem value="Organization">Organization</SelectItem>
                                        <SelectItem value="Bank Account">Bank Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormDescription>
                                The type of the node to be added to the graph.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="attributes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Attributes (JSON)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder='{"key": "value"}'
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Optional attributes for the node in JSON format.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">
                    Submit
                </Button>
            </form>
        </Form>
    );
}

export default function AddNodePopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button>
                    Add Node
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-4" onInteractOutside={(e) => e.preventDefault()}>
                <h3 className="text-lg font-semibold mb-4">Add New Node</h3>
                <AddNodeForm />
            </PopoverContent>
        </Popover>
    );
}